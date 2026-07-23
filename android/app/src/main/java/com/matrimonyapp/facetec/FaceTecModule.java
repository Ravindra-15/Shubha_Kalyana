package com.matrimonyapp.facetec;

import android.app.Activity;
import android.content.Intent;
import android.os.Build;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facetec.sdk.FaceTecInitializationError;
import com.facetec.sdk.FaceTecSDK;
import com.facetec.sdk.FaceTecSDKInstance;
import com.facetec.sdk.FaceTecSessionResult;
import com.facetec.sdk.FaceTecSessionStatus;

public final class FaceTecModule
        extends ReactContextBaseJavaModule
        implements ActivityEventListener {

    private static final String TAG = "FaceTecModule";
    private static final String ABI_ARM64 = "arm64-v8a";
    private static final String ABI_ARM32 = "armeabi-v7a";

    private final ReactApplicationContext reactContext;

    @Nullable
    private FaceTecSDKInstance sdkInstance;

    @Nullable
    private Promise enrollmentPromise;

    private String backendProcessSessionUrl = "";
    private String authToken = "";

    public FaceTecModule(
            @NonNull ReactApplicationContext reactContext
    ) {
        super(reactContext);

        this.reactContext = reactContext;
        reactContext.addActivityEventListener(this);
    }

    @NonNull
    @Override
    public String getName() {
        return "FaceTecModule";
    }

    @ReactMethod
    public void initialize(
            @NonNull String backendProcessSessionUrl,
            @Nullable String authToken,
            @NonNull Promise promise
    ) {
        Activity activity = getCurrentActivity();

        if (activity == null) {
            promise.reject(
                    "FACETEC_NO_ACTIVITY",
                    "Current Android activity is unavailable."
            );
            return;
        }

        if (backendProcessSessionUrl == null ||
                backendProcessSessionUrl.trim().isEmpty()) {
            promise.reject(
                    "FACETEC_INVALID_URL",
                    "FaceTec backend session URL is required."
            );
            return;
        }

        this.backendProcessSessionUrl =
                backendProcessSessionUrl.trim();

        this.authToken =
                authToken == null ? "" : authToken.trim();

        if (!isBundledFaceTecAbi()) {
            String abi = getPrimaryAbi();

            promise.reject(
                    "FACETEC_UNSUPPORTED_ABI",
                    "FaceTec is not available on this Android emulator ABI (" +
                            abi +
                            "). Please test profile verification on a physical ARM Android device."
            );
            return;
        }

        try {
            FaceTecSDK.preload(activity);

            SessionRequestProcessor processor =
                    new SessionRequestProcessor(
                            "",
                            this.backendProcessSessionUrl,
                            this.authToken
                    );

            FaceTecSDK.initializeWithSessionRequest(
                    activity,
                    Config.DeviceKeyIdentifier,
                    processor,
                    new FaceTecSDK.InitializeCallback() {
                        @Override
                        public void onSuccess(
                                @NonNull FaceTecSDKInstance newSdkInstance
                        ) {
                            sdkInstance = newSdkInstance;
                            promise.resolve(true);
                        }

                        @Override
                        public void onError(
                                @NonNull FaceTecInitializationError error
                        ) {
                            promise.reject(
                                    "FACETEC_INITIALIZATION_FAILED",
                                    safeMessage(
                                            error,
                                            "FaceTec initialization failed."
                                    )
                            );
                        }
                    }
            );
        } catch (RuntimeException error) {
            Log.e(TAG, "FaceTec initialization threw.", error);

            promise.reject(
                    "FACETEC_INITIALIZATION_EXCEPTION",
                    safeMessage(
                            error,
                            "FaceTec initialization could not be started."
                    ),
                    error
            );
        }
    }

    @ReactMethod
    public void startEnrollment(
            @NonNull String externalDatabaseRefID,
            @NonNull Promise promise
    ) {
        Activity activity = getCurrentActivity();

        if (activity == null) {
            promise.reject(
                    "FACETEC_NO_ACTIVITY",
                    "Current Android activity is unavailable."
            );
            return;
        }

        if (sdkInstance == null) {
            promise.reject(
                    "FACETEC_NOT_INITIALIZED",
                    "FaceTec must be initialized first."
            );
            return;
        }

        if (externalDatabaseRefID == null ||
                externalDatabaseRefID.trim().isEmpty()) {
            promise.reject(
                    "FACETEC_INVALID_REFERENCE",
                    "externalDatabaseRefID is required."
            );
            return;
        }

        if (enrollmentPromise != null) {
            promise.reject(
                    "FACETEC_SESSION_RUNNING",
                    "A FaceTec session is already running."
            );
            return;
        }

        enrollmentPromise = promise;

        SessionRequestProcessor processor =
                new SessionRequestProcessor(
                        externalDatabaseRefID.trim(),
                        backendProcessSessionUrl,
                        authToken
                );

        try {
            sdkInstance.start3DLiveness(
                    activity,
                    processor
            );
        } catch (RuntimeException error) {
            enrollmentPromise = null;
            Log.e(TAG, "FaceTec enrollment start threw.", error);

            promise.reject(
                    "FACETEC_START_FAILED",
                    safeMessage(
                            error,
                            "FaceTec could not start the verification session."
                    ),
                    error
            );
        }
    }

    @Override
    public void onActivityResult(
            Activity activity,
            int requestCode,
            int resultCode,
            @Nullable Intent data
    ) {
        FaceTecSessionResult sessionResult;

        try {
            sessionResult =
                    FaceTecSDK.getActivitySessionResult(
                            requestCode,
                            resultCode,
                            data
                    );
        } catch (RuntimeException error) {
            Log.e(TAG, "FaceTec activity result handling threw.", error);

            if (enrollmentPromise != null) {
                Promise promise = enrollmentPromise;
                enrollmentPromise = null;

                promise.reject(
                        "FACETEC_RESULT_FAILED",
                        safeMessage(
                                error,
                                "FaceTec could not process the verification result."
                        ),
                        error
                );
            }

            return;
        }

        if (sessionResult == null ||
                enrollmentPromise == null) {
            return;
        }

        Promise promise = enrollmentPromise;
        enrollmentPromise = null;

        FaceTecSessionStatus status =
                sessionResult.getStatus();

        boolean successful =
                status ==
                FaceTecSessionStatus.SESSION_COMPLETED;

        WritableMap result = Arguments.createMap();

        result.putBoolean("success", successful);

        result.putString(
                "sessionStatus",
                status == null
                        ? "UNKNOWN"
                        : status.toString()
        );

        if (successful) {
            promise.resolve(result);
        } else {
            promise.reject(
                    "FACETEC_SESSION_FAILED",
                    "FaceTec session ended with status: " +
                            (
                                    status == null
                                            ? "UNKNOWN"
                                            : status.toString()
                            )
            );
        }
    }

    @Override
    public void onNewIntent(Intent intent) {
        // FaceTec does not require anything here.
    }

    @NonNull
    private static String getPrimaryAbi() {
        if (Build.SUPPORTED_ABIS == null ||
                Build.SUPPORTED_ABIS.length == 0 ||
                Build.SUPPORTED_ABIS[0] == null ||
                Build.SUPPORTED_ABIS[0].trim().isEmpty()) {
            return "unknown";
        }

        return Build.SUPPORTED_ABIS[0];
    }

    private static boolean isBundledFaceTecAbi() {
        String abi = getPrimaryAbi();

        return ABI_ARM64.equals(abi) ||
                ABI_ARM32.equals(abi);
    }

    @NonNull
    private static String safeMessage(
            @Nullable Object error,
            @NonNull String fallbackMessage
    ) {
        if (error == null) {
            return fallbackMessage;
        }

        if (error instanceof Throwable) {
            String message = ((Throwable) error).getMessage();

            if (message != null && !message.trim().isEmpty()) {
                return message;
            }
        }

        String message = String.valueOf(error);
        return message.trim().isEmpty()
                ? fallbackMessage
                : message;
    }
}
