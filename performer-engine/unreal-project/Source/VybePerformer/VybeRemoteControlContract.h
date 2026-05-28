#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "VybeRemoteControlContract.generated.h"

USTRUCT(BlueprintType)
struct FVybeVisemeFrame
{
    GENERATED_BODY()

    UPROPERTY(BlueprintReadWrite, EditAnywhere, Category = "VYBE|Voice")
    float TimeMs = 0.0f;

    UPROPERTY(BlueprintReadWrite, EditAnywhere, Category = "VYBE|Voice")
    FString Viseme;

    UPROPERTY(BlueprintReadWrite, EditAnywhere, Category = "VYBE|Voice")
    float Weight = 0.0f;
};

UCLASS(Blueprintable)
class VYBEPERFORMER_API AVybePerformerAnimContract : public AActor
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category = "VYBE|Performer")
    void SetTargetPose(const FString& PoseName, float BlendTime);

    UFUNCTION(BlueprintCallable, Category = "VYBE|Performer")
    void PlayActionClip(const FString& ClipName, float Intensity, bool Loop);

    UFUNCTION(BlueprintCallable, Category = "VYBE|Performer")
    void SetIdleBehavior(float BreathingRate, float SwayAmount, float Energy);
};

UCLASS(Blueprintable)
class VYBEPERFORMER_API AVybeFaceRigContract : public AActor
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category = "VYBE|Face")
    void SetExpression(const FString& Expression, float Intensity, float BlendTime);

    UFUNCTION(BlueprintCallable, Category = "VYBE|Face")
    void SetLookAt(const FString& Target, float Intensity);

    UFUNCTION(BlueprintCallable, Category = "VYBE|Face")
    void ProcessVisemes(const FString& AudioURL, const TArray<FVybeVisemeFrame>& Visemes, float BodyEnergy);
};

UCLASS(Blueprintable)
class VYBEPERFORMER_API AVybePropManagerContract : public AActor
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category = "VYBE|Props")
    void AttachProp(const FString& PropId, const FString& Socket);

    UFUNCTION(BlueprintCallable, Category = "VYBE|Props")
    void DetachProp(const FString& PropId);

    UFUNCTION(BlueprintCallable, Category = "VYBE|Props")
    void ActivateProp(const FString& PropId);

    UFUNCTION(BlueprintCallable, Category = "VYBE|Props")
    void DeactivateProp(const FString& PropId);
};

UCLASS(Blueprintable)
class VYBEPERFORMER_API AVybeCameraDirectorContract : public AActor
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category = "VYBE|Camera")
    void SetPreset(const FString& Preset, float TransitionTime);
};

UCLASS(Blueprintable)
class VYBEPERFORMER_API AVybeWardrobeManagerContract : public AActor
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable, Category = "VYBE|Wardrobe")
    void SetGarmentState(const FString& GarmentId, const FString& State);
};
