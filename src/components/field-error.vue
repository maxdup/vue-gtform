<template>
<!--
    A summary of field errors, for clientside and serverside validation.
    It covers errors from the ValidityState spec as well as custom errors
    outside the spec.
    (See: https://developer.mozilla.org/en-US/docs/Web/API/ValidityState)
    Override these v-slots to customize error messages.
  -->
<ul class="field-error">
  <transition name="error-slot">
    <li v-if="getattr('typeMismatch')">
      <slot name="typeMismatch">Input doesn't match the required type</slot>
    </li>
  </transition>
  <transition name="error-slot">
    <li v-if="getattr('badInput')">
      <slot name="badInput">Input couldn't be interpreted</slot>
    </li>
  </transition>
  <transition name="error-slot">
    <li v-if="getattr('patternMismatch')">
      <slot name="patternMismatch">Input doesn't match the required format</slot>
    </li>
  </transition>
  <transition name="error-slot">
    <li v-if="getattr('rangeUnderflow')">
      <slot name="rangeUnderflow">This value is too low</slot>
    </li>
  </transition>
  <transition name="error-slot">
    <li v-if="getattr('rangeOverflow')">
      <slot name="rangeOverflow">This value is too high</slot>
    </li>
  </transition>
  <transition name="error-slot">
    <li v-if="getattr('valueMissing')">
      <slot name="valueMissing">This field is required</slot>
    </li>
  </transition>
  <transition name="error-slot">
    <li v-if="getattr('stepMismatch')">
      <slot name="stepMismatch">This value is out of range</slot>
    </li>
  </transition>
  <transition name="error-slot">
    <li v-if="getattr('tooShort')">
      <slot name="tooShort">This field is too short</slot>
    </li>
  </transition>
  <transition name="error-slot">
    <li v-if="getattr('tooLong')">
      <slot name="tooLong">This field is too long</slot>
    </li>
  </transition>
  <transition name="error-slot">
    <li v-if="getattr('notAuthorized')">
      <slot name="notAuthorized">Unauthorized</slot>
    </li>
  </transition>
  <transition name="error-slot">
    <li v-if="getattr('notFound')">
      <slot name="notFound">Not found</slot>
    </li>
  </transition>
  <transition name="error-slot">
    <li v-if="getattr('notUnique')">
      <slot name="notUnique">This value already exists</slot>
    </li>
  </transition>
  <transition name="error-slot">
    <li v-if="getattr('customError')">
      <slot name="customError">This field is invalid</slot>
    </li>
  </transition>
</ul>
</template>

<script>
const knownViolations = ['badInput', 'customError', 'patternMismatch',
                         'rangeOverflow', 'rangeUnderflow', 'stepMismatch',
                         'tooLong', 'tooShort', 'typeMismatch', 'valueMissing',
                         'notAuthorized', 'notUnique', 'notFound'];

let findError = (key, errors) => {
  if (!errors){
    return false
  }
  if (key == 'customError') {
    if (errors['customError'] &&
        knownViolations.indexOf(errors['customError']) == -1){
      return errors['customError']
    }
  } else {
    if (errors[key] || errors.customError == key){
      return true
    }
  }
  return false;
}
export default {
  name: 'field-error',
  props: {
    clientErrors: null,
    serverErrors: null,
  },
  created(){
    this.knownViolations = knownViolations;
  },
  methods: {
    getattr(attr){
      let error = findError(attr, this.clientErrors) ||
          findError(attr, this.serverErrors);
      return error;
    }
  },
}
</script>
