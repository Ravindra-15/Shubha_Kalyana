package com.matrimonyapp.facetec;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.facetec.sdk.FaceTecSessionRequestProcessor;

public final class SessionRequestProcessor
        implements FaceTecSessionRequestProcessor {

    private final String externalDatabaseRefID;
    private final String backendProcessSessionUrl;

    @Nullable
    private final String authToken;

    public SessionRequestProcessor(
            @NonNull String externalDatabaseRefID,
            @NonNull String backendProcessSessionUrl,
            @Nullable String authToken
    ) {
        this.externalDatabaseRefID = externalDatabaseRefID;
        this.backendProcessSessionUrl =
                backendProcessSessionUrl;
        this.authToken = authToken;
    }

    @Override
    public void onSessionRequest(
            @NonNull String sessionRequestBlob,
            @NonNull Callback sessionRequestCallback
    ) {
        SampleAppNetworkingRequest.send(
                this,
                sessionRequestBlob,
                sessionRequestCallback
        );
    }

    public void onResponseBlobReceived(
            @NonNull String responseBlob,
            @NonNull Callback sessionRequestCallback
    ) {
        sessionRequestCallback.processResponse(
                responseBlob
        );
    }

    public void onUploadProgress(
            float progress,
            @NonNull Callback sessionRequestCallback
    ) {
        sessionRequestCallback.updateProgress(progress);
    }

    public void onCatastrophicNetworkError(
            @NonNull Callback sessionRequestCallback
    ) {
        sessionRequestCallback.abortOnCatastrophicError();
    }

    @NonNull
    public String getExternalDatabaseRefID() {
        return externalDatabaseRefID;
    }

    @NonNull
    public String getBackendProcessSessionUrl() {
        return backendProcessSessionUrl;
    }

    @Nullable
    public String getAuthToken() {
        return authToken;
    }
}