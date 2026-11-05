package com.matrimonyapp.screensecure;

import android.app.Activity;
import android.view.WindowManager;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;

/**
 * Turns Android's FLAG_SECURE on/off for the app window: while it's on,
 * screenshots and screen recordings / screen sharing show a black screen.
 * Used only on screens that show another member's profile and photos (see
 * src/hooks/useScreenSecure.ts). React Native's Modal copies the flag onto
 * any dialog opened while it's set, so the photo viewer is covered too.
 */
public final class ScreenSecureModule extends ReactContextBaseJavaModule {

    public ScreenSecureModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @NonNull
    @Override
    public String getName() {
        return "ScreenSecure";
    }

    @ReactMethod
    public void enable() {
        setSecure(true);
    }

    @ReactMethod
    public void disable() {
        setSecure(false);
    }

    private void setSecure(boolean secure) {
        final Activity activity = getCurrentActivity();
        if (activity == null) return;
        activity.runOnUiThread(() -> {
            if (secure) {
                activity.getWindow().addFlags(WindowManager.LayoutParams.FLAG_SECURE);
            } else {
                activity.getWindow().clearFlags(WindowManager.LayoutParams.FLAG_SECURE);
            }
        });
    }
}
