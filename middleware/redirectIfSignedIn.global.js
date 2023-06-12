export default defineNuxtRouteMiddleware((to) => {
  if (to.fullPath.includes('dashboard')) return;

  const authed = useCookie('authed');

  if (authed.value === 'authed') {
    return navigateTo('/dashboard');
  }
});
