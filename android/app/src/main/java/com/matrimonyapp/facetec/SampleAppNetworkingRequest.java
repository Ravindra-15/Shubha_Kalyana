package com.matrimonyapp.facetec;

import android.os.Handler;
import android.os.Looper;
import android.util.Log;

import androidx.annotation.NonNull;

import com.facetec.sdk.FaceTecSDK;
import com.facetec.sdk.FaceTecSessionRequestProcessor;

import org.json.JSONException;
import org.json.JSONObject;

import java.io.IOException;

import okhttp3.Call;
import okhttp3.MediaType;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

public final class SampleAppNetworkingRequest {

    private static final String TAG = "FaceTecNetworking";
    private static final int MAX_ERROR_RETRIES = 4;

    private static int errorCount = 0;

    private SampleAppNetworkingRequest() {
    }

    public static void send(
            @NonNull SessionRequestProcessor referencingProcessor,
            @NonNull String sessionRequestBlob,
            @NonNull FaceTecSessionRequestProcessor.Callback sessionRequestCallback
    ) {
        try {
            JSONObject payload = new JSONObject();
            errorCount = 0;

            try {
                payload.put("requestBlob", sessionRequestBlob);

                String testingApiHeader =
                        FaceTecSDK.getTestingAPIHeader();

                if (testingApiHeader == null ||
                        testingApiHeader.trim().isEmpty()) {
                    Log.e(
                            TAG,
                            "FaceTec testing API header is unavailable."
                    );
                    referencingProcessor.onCatastrophicNetworkError(
                            sessionRequestCallback
                    );
                    return;
                }

                payload.put(
                        "testingApiHeader",
                        testingApiHeader
                );

                String externalDatabaseRefID =
                        referencingProcessor.getExternalDatabaseRefID();

                if (
                        externalDatabaseRefID != null &&
                        !externalDatabaseRefID.isEmpty()
                ) {
                    payload.put(
                            "externalDatabaseRefID",
                            externalDatabaseRefID
                    );
                }
            } catch (JSONException error) {
                referencingProcessor.onCatastrophicNetworkError(
                        sessionRequestCallback
                );
                return;
            }

            RequestBody requestBody = RequestBody.create(
                    MediaType.parse("application/json; charset=utf-8"),
                    payload.toString()
            );

            Request.Builder requestBuilder = new Request.Builder()
                    .url(referencingProcessor.getBackendProcessSessionUrl())
                    .header("Content-Type", "application/json");

            String authToken = referencingProcessor.getAuthToken();

            if (authToken != null && !authToken.isEmpty()) {
                requestBuilder.header(
                        "Authorization",
                        "Bearer " + authToken
                );
            }

            Request request = requestBuilder
                    .post(
                            new ProgressRequestBody(
                                    requestBody,
                                    (bytesWritten, totalBytes) -> {
                                        if (totalBytes <= 0) {
                                            return;
                                        }

                                        float progress =
                                                (float) bytesWritten /
                                                        (float) totalBytes;

                                        referencingProcessor.onUploadProgress(
                                                progress,
                                                sessionRequestCallback
                                        );
                                    }
                            )
                    )
                    .build();

            sendWithRetry(
                    request,
                    referencingProcessor,
                    sessionRequestCallback
            );
        } catch (RuntimeException error) {
            Log.e(
                    TAG,
                    "Unable to send FaceTec session request.",
                    error
            );
            referencingProcessor.onCatastrophicNetworkError(
                    sessionRequestCallback
            );
        }
    }

    private static void sendWithRetry(
            @NonNull Request request,
            @NonNull SessionRequestProcessor referencingProcessor,
            @NonNull FaceTecSessionRequestProcessor.Callback sessionRequestCallback
    ) {
        SampleAppNetworkingLibExample
                .getApiClient()
                .newCall(request)
                .enqueue(new okhttp3.Callback() {
                    @Override
                    public void onResponse(
                            @NonNull Call call,
                            @NonNull Response response
                    ) {
                        String responseBlob =
                                getResponseBlob(response);

                        if (responseBlob != null) {
                            referencingProcessor
                                    .onResponseBlobReceived(
                                            responseBlob,
                                            sessionRequestCallback
                                    );

                            return;
                        }

                        referencingProcessor
                                .onCatastrophicNetworkError(
                                        sessionRequestCallback
                                );
                    }

                    @Override
                    public void onFailure(
                            @NonNull Call call,
                            @NonNull IOException error
                    ) {
                        if (errorCount < MAX_ERROR_RETRIES) {
                            errorCount += 1;

                            new Handler(
                                    Looper.getMainLooper()
                            ).postDelayed(
                                    () -> sendWithRetry(
                                            request,
                                            referencingProcessor,
                                            sessionRequestCallback
                                    ),
                                    getRetryDelay(errorCount)
                            );

                            return;
                        }

                        Log.e(
                                TAG,
                                "FaceTec session request failed."
                        );

                        referencingProcessor
                                .onCatastrophicNetworkError(
                                        sessionRequestCallback
                                );
                    }
                });
    }

    private static String getResponseBlob(
            @NonNull Response response
    ) {
        try {
            if (!response.isSuccessful() ||
                    response.body() == null) {
                Log.e(
                        TAG,
                        "Backend returned HTTP " + response.code()
                );

                return null;
            }

            JSONObject responseJSON = new JSONObject(
                    response.body().string()
            );

            String responseBlob =
                    responseJSON.optString(
                            "responseBlob",
                            ""
                    );

            /*
             * Also supports a backend response shaped like:
             *
             * {
             *   "data": {
             *     "responseBlob": "..."
             *   }
             * }
             */
            if (responseBlob.isEmpty()) {
                JSONObject data =
                        responseJSON.optJSONObject("data");

                if (data != null) {
                    responseBlob = data.optString(
                            "responseBlob",
                            ""
                    );
                }
            }

            return responseBlob.isEmpty()
                    ? null
                    : responseBlob;
        } catch (IOException | JSONException | RuntimeException error) {
            Log.e(
                    TAG,
                    "Unable to process backend response.",
                    error
            );

            return null;
        } finally {
            response.close();
        }
    }

    private static int getRetryDelay(int currentErrorCount) {
        if (currentErrorCount == 1) {
            return 0;
        }

        if (currentErrorCount == 2) {
            return 2000;
        }

        if (currentErrorCount == 3) {
            return 5000;
        }

        if (currentErrorCount == 4) {
            return 10000;
        }

        return 0;
    }
}
