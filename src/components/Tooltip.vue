<template>
  <div class="tooltip-container" @mouseenter="show = true" @mouseleave="show = false">
    <slot></slot>
    <div class="tooltip-text" v-if="show">
      {{ text }}
    </div>
  </div>
</template>

<script>
export default {
  name: 'Tooltip',
  props: {
    text: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      show: false
    };
  }
};
</script>

<style scoped>
.tooltip-container {
  position: relative;
  display: inline-block;
  overflow: visible;
}

.tooltip-text {
  white-space: nowrap;
  position: absolute;
  top: 100%;
  margin-top: 4px;
  left: 50%;
  transform: translateX(-50%);
  padding: 5px;
  background-color: rgba(50, 50, 50, 0.9);
  color: #fff;
  border-radius: 3px;
  font-size: 12px;
  pointer-events: none;
  z-index: 10;
  box-shadow: 0px 2px 6px rgba(0, 0, 0, 0.3);
}
</style>