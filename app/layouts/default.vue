<template>
  <div class="min-h-screen flex flex-col">
    <a href="#main" class="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-2 focus:left-2 focus:bg-ink focus:text-cream focus:px-4 focus:py-2 focus:rounded-full">រំលងទៅមាតិកា</a>
    <AnnouncementBar />
    <NavBar />
    <main id="main" class="flex-1">
      <slot />
    </main>
    <SiteFooter />
    <MobileTabBar />
  </div>
</template>
