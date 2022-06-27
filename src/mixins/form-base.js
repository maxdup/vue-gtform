import serverError from '../components/server-error.vue';
import fieldError from '../components/field-error.vue';

// Notes on implementing forms
// ---------------------------

// The clientside validation will only consider inputs with names
// (this goes for field and form for validity, loading clientside
// and serverside errors)

// Minimally, you'll need to implement:
// - formRequest()

// You'll likely want to implment:
// - formPayload() (provides data for formRequest)

// Callback functions can be implemented:
// - formSuccess()
// - formError()


export default {
  props: {
    formContext: {default: () => { return {} }},
    formPreload: {default: () => { return {} }},
  },
  data(){
    return {
      formData: {},
      formErrors: {},
      formErrorsClient: null,
      formErrorsServer: null,
      formValid: true,
      formLoading: false,
      formPassword: null,
      formCaptcha: null,
    }
  },
  components: {
    serverError: serverError,
    fieldError: fieldError
  },
  mounted(){
    if (this.$el.tagName == 'FORM'){
      this.form = this.$el;
    } else {
      this.form = this.$el.getElementsByTagName('form')[0];
    }
    this.mounted = true;
    this.blured = {};
    this.form.acceptCharset = 'UTF-8';
    this.form.noValidate = true;
    this.form.onsubmit = (e) => { e.preventDefault(); }
    this.formValid = true;
    this.formErrorsClient = {};
    this.formErrorsServer = {};

    for (let i = 0; i < this.form.elements.length; i++){
      let inputElem = this.form.elements[i];
      if (!inputElem.name){
        continue
      }
      this.formErrorsClient[inputElem.name] = {};
      this.formErrorsServer[inputElem.name] = {};

      inputElem.onblur = () => {
        this.blured[inputElem.name] = true;
        this._testFieldValid(inputElem);
        this.$forceUpdate();
      }
      inputElem.oninput = () => {
        this._testFormValid();
        if (this.blured[inputElem.name]) {
          this._testFieldValid(inputElem);
          this.$forceUpdate();
        }
        this.formErrorsServer[inputElem.name] = {}
        this.formErrorsServer['server'] = {}
      }
    }
    this._testFormValid();
  },
  created(){
    this.formReset();
  },
  methods: {
    formPayload(){
      // - To be overridden -
      // (Must return an object)
      return this.formData;
    },
    formRequest(payload){
      // - To be overridden -
      // (Must return a promise)
      // ex: return myApi.account.update(payload).promise;
    },
    formSuccess(response){
      // - To be overridden -
      // ex: this.formReset();
    },
    formError(errors){
      // - To be overridden -
    },
    formSubmit(){
      if (!this._testFormValid(true)){
        this.$forceUpdate();
        return
      }
      // wipe remaining validation errors
      let fields = Object.keys(this.formErrorsClient)
      for (let i = 0; i < fields.length; i++) {
        this.formErrorsClient[fields[i]] = {};
      }
      this.formLoading = true;
      let payload = this.formPayload();

      if (this.formPassword){ payload.password = this.formPassword }
      if (this.formCaptcha){ payload.captcha = this.formCaptcha }

      let request = this.formRequest(payload);

      request.then((response) => {
        this._formSuccess(response);
      }, (response) => {
        if (response && response.errors) {
          this._formError(response.errors);
        } else {
          this._formError({server: response});
        }
      });
      return request;
    },
    _validityStateSummarize(inputElem){
      const VIOLATIONS = [
        'badInput', 'patternMismatch', 'rangeOverflow', 'rangeUnderflow',
        'stepMismatch', 'tooLong', 'tooShort', 'typeMismatch', 'valueMissing']
      let report = {}
      VIOLATIONS.forEach(function (violation, index) {
        if (inputElem.validity[violation]){
          report[violation] = true;
        }
      });
      if (inputElem.validity.customError){
        report['customError'] = inputElem.validationMessage;
      }
      return report
    },
    _testFieldValid(inputElem, onSubmit){
      // clientside validation test for a given field
      let fieldValid = inputElem.checkValidity();
      if (!fieldValid &&
          (this.blured[inputElem.name] || onSubmit)){
        this.formErrorsClient[inputElem.name] =
          this._validityStateSummarize(inputElem);
      } else {
        this.formErrorsClient[inputElem.name] = {}
      }
      return fieldValid
    },
    _testFormValid(onSubmit){
      // clientside validation test for the form
      let formValid = true;
      for (let i = 0; i < this.form.elements.length; i++){
        if (!this.form.elements[i].name){
          continue
        }
        let inputElem = this.form.elements[i]
        if (!this._testFieldValid(inputElem, onSubmit)){
          formValid = false
        }
      }
      this.formValid = formValid;
      return this.formValid;
    },
    _formSuccess(response){
      this.$emit('form-success', response);
      this.formLoading = false;
      this.formSuccess(response);
    },
    _formError(errors){
      this.formLoading = false;
      for (const [key, value] of Object.entries(this.formErrorsServer)) {
        this.formErrorsServer[key] = {}
      }
      for (const [key, value] of Object.entries(errors)){
        if (key == 'server' && value == 'Page not found'){
          this.formErrorsServer.server = { 'notFound': true };
          continue
        }
        if (key == 'server' && value == 'Unauthorized'){
          this.formErrorsServer.server = { 'notAuthorized': true };
          continue
        }
        this.formErrorsServer[key] = { 'customError': value[0] };
      }
      this.$emit('form-error', errors);
      this.formError(errors);
    },
    formReset(){
      if (this.mounted){
        for (let i = 0; i < this.form.elements.length; i++){
          this.form.elements[i].blur();
        }
      }
      this.formErrorsServer = {};
      this.formErrorsClient = {};
      this.blured = {};
      this.formPassword = null;
      this.formCaptcha = null;
      if (this.formPreload){
        Object.assign(this.formData, this.formPreload);
      }
    }
  }
}
