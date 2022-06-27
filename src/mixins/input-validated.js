// HTML5 Validation mixin for arbitratry Vue components.
// Validates the model value against standard html validations
// (min, max, pattern, required, step, minlength, maxlength)

export default {
  props: {
    modelValue: null,
    name: {default: Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 5) },
    pattern: null,
    min: null,
    max: null,
    required: Boolean,
    step: null,
    minlength: Number,
    maxlength: Number,
  },
  created(){
    this._value = this.modelValue;
    this._name = this.name;
    this._pattern = this.pattern;
    this._min = this.min;
    this._max = this.max;
    this._required = this.required;
    this._step = this.step;
    this._minlength = this.minlength;
    this._maxlength = this.maxlength;
  },
  mounted(){
    this.vInput = document.createElement("input");
    this.vInput.setAttribute('type', 'text');
    let constraints = ['name', 'pattern', 'step',
                       'min', 'max', 'required'];
    for (let i = 0; i < constraints.length; i++){
      if (this['_' + constraints[i]]){
        this.vInput.setAttribute(constraints[i], this['_' + constraints[i]]);
      }
    }
    this.vInput.setAttribute('style', 'display: none !important');
    this.$el.appendChild(this.vInput);

    this.$el.addEventListener('focusout', (event) => {
      if (!event.relatedTarget ||
          !this.$el.contains(event.relatedTarget)){
        let event = new Event('blur', {
          bubbles: true,
          cancelable: true
        });
        this.vInput.dispatchEvent(event);
      }
    });
    this.validate();
  },
  methods: {
    validate(){
      if (!this.$el || !this.vInput){ return }
      if (this.modelValue){
        if (this._minlength && this.modelValue.length < this._minlength){
          this.vInput.setCustomValidity('tooShort');
        } else if (this.vInput.validationMessage == 'tooShort'){
          this.vInput.setCustomValidity('');
        }
        if (this._maxlength && this.modelValue.length > this._maxlength){
          this.vInput.setCustomValidity('tooLong');
        } else if (this.vInput.validationMessage == 'tooLong'){
          this.vInput.setCustomValidity('');
        }
      }
      let ivalue = this.modelValue || '';
      this.vInput.setAttribute('value', ivalue);
      let event = new Event('input', {
        bubbles: true,
        cancelable: true
      });
      this.vInput.dispatchEvent(event);
    }
  },
  watch: {
    modelValue(){
      this.validate();
    }
  }
}
