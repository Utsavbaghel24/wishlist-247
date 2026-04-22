export default function AppIndex() {
  const steps = [
    "Go to Online Store → Themes",
    "Click Customize on your active theme",
    "Open a Product page template",
    "Add the Wishlist Button app block",
    "Save the theme changes",
    "Create a page with handle wishlist and assign the Wishlist page template",
  ];

  const features = [
    "Add to Wishlist button on product pages",
    "Floating wishlist icon with live count",
    "Dedicated wishlist page for saved items",
    "Remove saved products anytime",
    "Add wishlist items directly to cart",
  ];

  const notes = [
    "Works best with Online Store 2.0 themes",
    "App blocks can be added, removed, and repositioned from the theme editor",
    "If your theme does not support app blocks, use a supported theme before setup",
    "Make sure the wishlist page handle is exactly wishlist",
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
            Wishlist247 is Active
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr] lg:items-center">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Welcome to Wishlist247
              </h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">
                Wishlist247 helps your customers save products, revisit them
                later, and add them to cart from a clean, dedicated wishlist
                experience. This page gives you the exact setup steps needed to
                get the app live on your storefront quickly and correctly.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  Product Page Button
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  Floating Wishlist Icon
                </div>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  Dedicated Wishlist Page
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white shadow-sm">
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-300">
                Quick Setup Summary
              </div>
              <div className="mt-4 space-y-3 text-sm leading-6 text-slate-200">
                <p>1. Add the Wishlist Button app block on product pages.</p>
                <p>2. Create the wishlist page and assign the correct template.</p>
                <p>3. Save and preview your storefront.</p>
              </div>
              <div className="mt-5 rounded-2xl bg-white/10 px-4 py-3 text-sm text-slate-100">
                Required page handle:
                <span className="ml-2 rounded-lg bg-white px-2 py-1 font-semibold text-slate-900">
                  /wishlist
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 20.5s-7-4.35-9-8.37C1.35 8.8 3.1 5.5 6.34 5.04A5.18 5.18 0 0 1 12 8a5.18 5.18 0 0 1 5.66-2.96c3.24.46 4.99 3.76 3.34 7.09-2 4.02-9 8.37-9 8.37Z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  What the app does
                </h2>
                <p className="text-sm text-slate-500">
                  Core storefront functionality available after setup
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {features.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M9 12l2 2 4-4" />
                  <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Store requirements
                </h2>
                <p className="text-sm text-slate-500">
                  Setup details to complete before launch
                </p>
              </div>
            </div>

            <div className="space-y-4 text-sm leading-6 text-slate-600">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="font-semibold text-slate-900">Required page handle</div>
                <div className="mt-2 inline-flex rounded-xl bg-slate-900 px-3 py-1.5 font-semibold text-white">
                  wishlist
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="font-semibold text-slate-900">Page title</div>
                <div className="mt-1">My Wishlist</div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="font-semibold text-slate-900">Assign template</div>
                <div className="mt-1">
                  Use the Wishlist page template for the page with handle{" "}
                  <span className="font-semibold text-slate-900">wishlist</span>.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                <svg
                  viewBox="0 0 24 24"
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 6v6l4 2" />
                  <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-semibold text-slate-900">
                  Setup instructions
                </h2>
                <p className="text-sm text-slate-500">
                  Follow these steps after installation
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {steps.map((step, index) => (
                <div
                  key={step}
                  className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                    {index + 1}
                  </div>
                  <div className="pt-1 text-sm font-medium leading-6 text-slate-700">
                    {step}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
              <span className="font-semibold">Important:</span> Add the Wishlist
              Button block on product page templates where you want customers to
              save products. Then create the wishlist page so customers can view,
              remove, and add saved items to cart.
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-pink-100 text-pink-700">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35Z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">
                    Merchant notes
                  </h2>
                  <p className="text-sm text-slate-500">
                    Helpful reminders before publishing
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {notes.map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-white">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M22 16.92V19a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 2.12 3.18 2 2 0 0 1 4.11 1h2.09a2 2 0 0 1 2 1.72c.12.9.33 1.78.63 2.63a2 2 0 0 1-.45 2.11L7.1 8.74a16 16 0 0 0 8.16 8.16l1.28-1.28a2 2 0 0 1 2.11-.45c.85.3 1.73.51 2.63.63A2 2 0 0 1 22 16.92Z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold">Help & support</h2>
                  <p className="text-sm text-slate-300">
                    Quick help for setup and troubleshooting
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-sm leading-6 text-slate-200">
                <p>
                  If you face any issue during setup or need help with theme
                  placement, reach out and we’ll help you quickly.
                </p>

                <div className="rounded-2xl bg-white/10 p-4">
                  <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-300">
                    Support email
                  </div>
                  <a
                    href="mailto:wishlistpro247@gmail.com"
                    className="mt-1 block break-all text-base font-semibold text-white underline underline-offset-4"
                  >
                    wishlistpro247@gmail.com
                  </a>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-slate-100">
                  Instant replies available for setup support and onboarding
                  guidance.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}