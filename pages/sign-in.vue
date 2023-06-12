<script setup>
const authed = useCookied('authed', { sameSite: 'strict' });

function signIn() {
  authed.value = 'authed';
  // nextTick(() => {
  //   return navigateTo('/dashboard');
  // console.log('cookie next tick after value set: ', document.cookie);
  // });
  setTimeout(() => {
    return navigateTo('/dashboard');
    // debugger;
    // return;
  }, 200);
}
</script>

<template>
  <div>
    <div>On sign in page</div>
    <div>Cookie value is {{ authed }}</div>
    <div>
      <a href="#" @click.prevent="signIn">Set to authed and redirect</a>
    </div>
  </div>
</template>
