// -----------------------------------------------------------------------------
// File: EdgeToEdge.kt
// Purpose: Draws an activity edge-to-edge and manually pads specific views by
//          the actual system-bar insets. Needed because the legacy
//          android:fitsSystemWindows XML attribute stops reliably reaching a
//          nested view once a SwipeRefreshLayout/ScrollView sits in between:
//          it gets consumed by whichever ancestor sees it first (often the
//          activity's root layout), leaving a blank gap above content that
//          expects to bleed under the status bar instead.
// Module owner: shared infrastructure
// -----------------------------------------------------------------------------
package com.solarmicrogrid.app.util

import android.app.Activity
import android.view.View
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat

// `topInsetView` keeps its own background bleeding under the status bar while its
// content is pushed below it. `bottomInsetView` (e.g. a BottomNavigationView) is
// pushed above the gesture/nav bar the same way.
fun Activity.applyEdgeToEdgeInsets(topInsetView: View? = null, bottomInsetView: View? = null) {
    WindowCompat.setDecorFitsSystemWindows(window, false)
    val root = topInsetView?.rootView ?: bottomInsetView?.rootView ?: return
    ViewCompat.setOnApplyWindowInsetsListener(root) { _, insets ->
        val bars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
        topInsetView?.setPadding(topInsetView.paddingLeft, bars.top, topInsetView.paddingRight, topInsetView.paddingBottom)
        bottomInsetView?.setPadding(bottomInsetView.paddingLeft, bottomInsetView.paddingTop, bottomInsetView.paddingRight, bars.bottom)
        insets
    }
}
