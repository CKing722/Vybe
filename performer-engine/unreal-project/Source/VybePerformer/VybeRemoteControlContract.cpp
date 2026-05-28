#include "VybeRemoteControlContract.h"

void AVybePerformerAnimContract::SetTargetPose(const FString& PoseName, float BlendTime) {}

void AVybePerformerAnimContract::PlayActionClip(const FString& ClipName, float Intensity, bool Loop) {}

void AVybePerformerAnimContract::SetIdleBehavior(float BreathingRate, float SwayAmount, float Energy) {}

void AVybeFaceRigContract::SetExpression(const FString& Expression, float Intensity, float BlendTime) {}

void AVybeFaceRigContract::SetLookAt(const FString& Target, float Intensity) {}

void AVybeFaceRigContract::ProcessVisemes(const FString& AudioURL, const TArray<FVybeVisemeFrame>& Visemes, float BodyEnergy) {}

void AVybePropManagerContract::AttachProp(const FString& PropId, const FString& Socket) {}

void AVybePropManagerContract::DetachProp(const FString& PropId) {}

void AVybePropManagerContract::ActivateProp(const FString& PropId) {}

void AVybePropManagerContract::DeactivateProp(const FString& PropId) {}

void AVybeCameraDirectorContract::SetPreset(const FString& Preset, float TransitionTime) {}

void AVybeWardrobeManagerContract::SetGarmentState(const FString& GarmentId, const FString& State) {}
