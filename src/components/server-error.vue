<template>
<div class="server-error" v-if="errors && errors.customError">
  <ul>
    <li>There was a server error, try again later</li>
  </ul>
</div>
</template>

<script>
export default {
  name: 'server-error',
  props: {
    'errors': {},
  },
}
</script>
