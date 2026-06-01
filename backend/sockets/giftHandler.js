const { sendGift } = require('../services/sparkEngine');
const { recordGiftForStorm } = require('../services/stormService');

function registerGiftHandler(io, socket) {
  socket.on('send_gift', async (payload, ack) => {
    try {
      if (!socket.user?.sub) {
        throw new Error('Authentication required');
      }

      const result = await sendGift({
        senderId: socket.user.sub,
        performerId: payload.performer_id || payload.performerId,
        giftTypeId: payload.gift_type_id || payload.giftTypeId,
        roomId: payload.room_id || payload.roomId,
      });

      io.to(result.giftSent.roomId).emit('gift_animation', result.animation);
      if (result.banner) {
        io.emit('platform_banner', result.banner);
      }

      const stormEvents = recordGiftForStorm({
        roomId: result.giftSent.roomId,
        performerId: result.giftSent.performerId,
        senderId: result.giftSent.senderId,
        sparkCost: result.giftSent.sparkCost,
      });
      for (const event of stormEvents) {
        io.to(result.giftSent.roomId).emit(event.type, event.payload);
      }

      if (result.leaderboard) {
        io.to(result.giftSent.roomId).emit('leaderboard_update', result.leaderboard);
      }

      if (typeof ack === 'function') {
        ack({ ok: true, result });
      }
    } catch (error) {
      if (typeof ack === 'function') {
        ack({ ok: false, error: error.message });
      }
      socket.emit('gift_error', { message: error.message });
    }
  });
}

module.exports = { registerGiftHandler };
