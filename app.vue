<script setup>
onMounted(() => {
  cookieStore.addEventListener('change', (event) => {
    console.log(event);
  });
});
</script>

<template>
  <div>
    <NuxtPage />
  </div>
</template>
