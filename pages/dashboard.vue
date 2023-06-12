<script setup>
console.log('before usecookied use');
const authed = useCookied('authed', { sameSite: 'strict' });
console.log('after usecookied use');

function redirect() {
  authed.value = 'not authed';

  setTimeout(() => {
    return navigateTo('/sign-in');
  }, 200);
}
</script>

<template>
  <div>
    <div>On dashboard</div>
    <div>Cookie value is {{ authed }}</div>
    <div>
      <a href="#" @click.prevent="redirect">Set to not authed and redirect</a>
    </div>
  </div>
</template>
