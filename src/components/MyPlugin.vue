<template>
  <div class="w-[600px] bg-white rounded-lg shadow-md mx-auto mt-10 px-8 py-5">
    <nav class="flex justify-end space-x-8 text-neutral-700 text-sm">
      <a href="#" class="hover:underline">Home</a>
      <a href="#" class="hover:underline">Secret</a>
      <a href="#" class="hover:underline">Login</a>
    </nav>
    <h1 class="text-center text-3xl font-title text-neutral-900 mt-5">Test Form</h1>
    <form class="mt-6 space-y-4">
      <div class="flex flex-col">
        <label for="email" class="text-neutral-800">Email:</label>
        <input type="email" id="email" name="email" class="border border-neutral-300 rounded-md px-2 py-1"/>
      </div>
      <div class="flex flex-col">
        <label for="password" class="text-neutral-800">Password:</label>
        <input type="password" id="password" name="password" class="border border-neutral-300 rounded-md px-2 py-1"/>
      </div>
      <div class="flex flex-col">
        <label for="first-name" class="text-neutral-800">First Name:</label>
        <input type="text" id="first-name" name="first-name" class="border border-neutral-300 rounded-md px-2 py-1"/> </div>
      <div class="flex flex-col space-y-3 items-center">
        <button type="button" class="bg-neutral-200 rounded-md px-8 py-2 border border-neutral-400"> Create </button>
        <button type="button" class="bg-neutral-200 rounded-md px-8 py-2 border border-neutral-400"> Login </button>
        <button type="button" class="bg-neutral-200 rounded-md px-8 py-2 border border-neutral-400"> See User </button>
        <button type="button" class="bg-neutral-200 rounded-md px-8 py-2 border border-neutral-400"> Logout </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
@import url(https://fonts.googleapis.com/css2?family=Lato&display=swap);

@import url(https://fonts.googleapis.com/css2?family=Open+Sans&display=swap);

/*! tailwindcss v3.4.11 | MIT License | https://tailwindcss.com*/
*,
:after,
:before {
  border: 0 solid #e5e7eb;
  box-sizing: border-box;
}
:after,
:before {
  --tw-content: "";
}
:host,
html {
  line-height: 1.5;
  -webkit-text-size-adjust: 100%;
  font-family:
      Open Sans,
      ui-sans-serif,
      system-ui,
      sans-serif,
      Apple Color Emoji,
      Segoe UI Emoji,
      Segoe UI Symbol,
      Noto Color Emoji;
  font-feature-settings: normal;
  font-variation-settings: normal;
  -moz-tab-size: 4;
  tab-size: 4;
  -webkit-tap-highlight-color: transparent;
}
body {
  line-height: inherit;
  margin: 0;
}
hr {
  border-top-width: 1px;
  color: inherit;
  height: 0;
}
abbr:where([title]) {
  text-decoration: underline dotted;
}
h1,
h2,
h3,
h4,
h5,
h6 {
  font-size: inherit;
  font-weight: inherit;
}
a {
  color: inherit;
  text-decoration: inherit;
}
b,
strong {
  font-weight: bolder;
}
code,
kbd,
pre,
samp {
  font-family:
      ui-monospace,
      SFMono-Regular,
      Menlo,
      Monaco,
      Consolas,
      Liberation Mono,
      Courier New,
      monospace;
  font-feature-settings: normal;
  font-size: 1em;
  font-variation-settings: normal;
}
small {
  font-size: 80%;
}
sub,
sup {
  font-size: 75%;
  line-height: 0;
  position: relative;
  vertical-align: baseline;
}
sub {
  bottom: -0.25em;
}
sup {
  top: -0.5em;
}
table {
  border-collapse: collapse;
  border-color: inherit;
  text-indent: 0;
}
button,
input,
optgroup,
select,
textarea {
  color: inherit;
  font-family: inherit;
  font-feature-settings: inherit;
  font-size: 100%;
  font-variation-settings: inherit;
  font-weight: inherit;
  letter-spacing: inherit;
  line-height: inherit;
  margin: 0;
  padding: 0;
}
button,
select {
  text-transform: none;
}
button,
input:where([type="button"]),
input:where([type="reset"]),
input:where([type="submit"]) {
  -webkit-appearance: button;
  background-color: transparent;
  background-image: none;
}
:-moz-focusring {
  outline: auto;
}
:-moz-ui-invalid {
  box-shadow: none;
}
progress {
  vertical-align: baseline;
}
::-webkit-inner-spin-button,
::-webkit-outer-spin-button {
  height: auto;
}
[type="search"] {
  -webkit-appearance: textfield;
  outline-offset: -2px;
}
::-webkit-search-decoration {
  -webkit-appearance: none;
}
::-webkit-file-upload-button {
  -webkit-appearance: button;
  font: inherit;
}
summary {
  display: list-item;
}
blockquote,
dd,
dl,
figure,
h1,
h2,
h3,
h4,
h5,
h6,
hr,
p,
pre {
  margin: 0;
}
fieldset {
  margin: 0;
}
fieldset,
legend {
  padding: 0;
}
menu,
ol,
ul {
  list-style: none;
  margin: 0;
  padding: 0;
}
dialog {
  padding: 0;
}
textarea {
  resize: vertical;
}
input::placeholder,
textarea::placeholder {
  color: #9ca3af;
  opacity: 1;
}
[role="button"],
button {
  cursor: pointer;
}
:disabled {
  cursor: default;
}
audio,
canvas,
embed,
iframe,
img,
object,
svg,
video {
  display: block;
  vertical-align: middle;
}
img,
video {
  height: auto;
  max-width: 100%;
}
[hidden] {
  display: none;
}
*,
:after,
:before {
  --tw-border-spacing-x: 0;
  --tw-border-spacing-y: 0;
  --tw-translate-x: 0;
  --tw-translate-y: 0;
  --tw-rotate: 0;
  --tw-skew-x: 0;
  --tw-skew-y: 0;
  --tw-scale-x: 1;
  --tw-scale-y: 1;
  --tw-pan-x: ;
  --tw-pan-y: ;
  --tw-pinch-zoom: ;
  --tw-scroll-snap-strictness: proximity;
  --tw-gradient-from-position: ;
  --tw-gradient-via-position: ;
  --tw-gradient-to-position: ;
  --tw-ordinal: ;
  --tw-slashed-zero: ;
  --tw-numeric-figure: ;
  --tw-numeric-spacing: ;
  --tw-numeric-fraction: ;
  --tw-ring-inset: ;
  --tw-ring-offset-width: 0px;
  --tw-ring-offset-color: #fff;
  --tw-ring-color: rgba(59, 130, 246, 0.5);
  --tw-ring-offset-shadow: 0 0 #0000;
  --tw-ring-shadow: 0 0 #0000;
  --tw-shadow: 0 0 #0000;
  --tw-shadow-colored: 0 0 #0000;
  --tw-blur: ;
  --tw-brightness: ;
  --tw-contrast: ;
  --tw-grayscale: ;
  --tw-hue-rotate: ;
  --tw-invert: ;
  --tw-saturate: ;
  --tw-sepia: ;
  --tw-drop-shadow: ;
  --tw-backdrop-blur: ;
  --tw-backdrop-brightness: ;
  --tw-backdrop-contrast: ;
  --tw-backdrop-grayscale: ;
  --tw-backdrop-hue-rotate: ;
  --tw-backdrop-invert: ;
  --tw-backdrop-opacity: ;
  --tw-backdrop-saturate: ;
  --tw-backdrop-sepia: ;
  --tw-contain-size: ;
  --tw-contain-layout: ;
  --tw-contain-paint: ;
  --tw-contain-style: ;
}
::backdrop {
  --tw-border-spacing-x: 0;
  --tw-border-spacing-y: 0;
  --tw-translate-x: 0;
  --tw-translate-y: 0;
  --tw-rotate: 0;
  --tw-skew-x: 0;
  --tw-skew-y: 0;
  --tw-scale-x: 1;
  --tw-scale-y: 1;
  --tw-pan-x: ;
  --tw-pan-y: ;
  --tw-pinch-zoom: ;
  --tw-scroll-snap-strictness: proximity;
  --tw-gradient-from-position: ;
  --tw-gradient-via-position: ;
  --tw-gradient-to-position: ;
  --tw-ordinal: ;
  --tw-slashed-zero: ;
  --tw-numeric-figure: ;
  --tw-numeric-spacing: ;
  --tw-numeric-fraction: ;
  --tw-ring-inset: ;
  --tw-ring-offset-width: 0px;
  --tw-ring-offset-color: #fff;
  --tw-ring-color: rgba(59, 130, 246, 0.5);
  --tw-ring-offset-shadow: 0 0 #0000;
  --tw-ring-shadow: 0 0 #0000;
  --tw-shadow: 0 0 #0000;
  --tw-shadow-colored: 0 0 #0000;
  --tw-blur: ;
  --tw-brightness: ;
  --tw-contrast: ;
  --tw-grayscale: ;
  --tw-hue-rotate: ;
  --tw-invert: ;
  --tw-saturate: ;
  --tw-sepia: ;
  --tw-drop-shadow: ;
  --tw-backdrop-blur: ;
  --tw-backdrop-brightness: ;
  --tw-backdrop-contrast: ;
  --tw-backdrop-grayscale: ;
  --tw-backdrop-hue-rotate: ;
  --tw-backdrop-invert: ;
  --tw-backdrop-opacity: ;
  --tw-backdrop-saturate: ;
  --tw-backdrop-sepia: ;
  --tw-contain-size: ;
  --tw-contain-layout: ;
  --tw-contain-paint: ;
  --tw-contain-style: ;
}
#webcrumbs .mx-auto {
  margin-left: auto;
  margin-right: auto;
}
#webcrumbs .mt-10 {
  margin-top: 40px;
}
#webcrumbs .mt-5 {
  margin-top: 20px;
}
#webcrumbs .mt-6 {
  margin-top: 24px;
}
#webcrumbs .flex {
  display: flex;
}
#webcrumbs .w-\[600px\] {
  width: 600px;
}
#webcrumbs .flex-row {
  flex-direction: row;
}
#webcrumbs .flex-col {
  flex-direction: column;
}
#webcrumbs .items-center {
  align-items: center;
}
#webcrumbs .justify-end {
  justify-content: flex-end;
}
#webcrumbs .justify-between {
  justify-content: space-between;
}
#webcrumbs .gap-4 {
  gap: 16px;
}
#webcrumbs :is(.space-x-8 > :not([hidden]) ~ :not([hidden])) {
  --tw-space-x-reverse: 0;
  margin-left: calc(32px * (1 - var(--tw-space-x-reverse)));
  margin-right: calc(32px * var(--tw-space-x-reverse));
}
#webcrumbs :is(.space-y-3 > :not([hidden]) ~ :not([hidden])) {
  --tw-space-y-reverse: 0;
  margin-bottom: calc(12px * var(--tw-space-y-reverse));
  margin-top: calc(12px * (1 - var(--tw-space-y-reverse)));
}
#webcrumbs :is(.space-y-4 > :not([hidden]) ~ :not([hidden])) {
  --tw-space-y-reverse: 0;
  margin-bottom: calc(16px * var(--tw-space-y-reverse));
  margin-top: calc(16px * (1 - var(--tw-space-y-reverse)));
}
#webcrumbs .rounded-lg {
  border-radius: 24px;
}
#webcrumbs .rounded-md {
  border-radius: 18px;
}
#webcrumbs .border {
  border-width: 1px;
}
#webcrumbs .border-neutral-300 {
  --tw-border-opacity: 1;
  border-color: rgb(202 202 202 / var(--tw-border-opacity));
}
#webcrumbs .border-neutral-400 {
  --tw-border-opacity: 1;
  border-color: rgb(177 177 177 / var(--tw-border-opacity));
}
#webcrumbs .bg-neutral-200 {
  --tw-bg-opacity: 1;
  background-color: rgb(224 224 224 / var(--tw-bg-opacity));
}
#webcrumbs .bg-white {
  --tw-bg-opacity: 1;
  background-color: rgb(255 255 255 / var(--tw-bg-opacity));
}
#webcrumbs .px-2 {
  padding-left: 8px;
  padding-right: 8px;
}
#webcrumbs .px-8 {
  padding-left: 32px;
  padding-right: 32px;
}
#webcrumbs .py-1 {
  padding-bottom: 4px;
  padding-top: 4px;
}
#webcrumbs .py-2 {
  padding-bottom: 8px;
  padding-top: 8px;
}
#webcrumbs .py-5 {
  padding-bottom: 20px;
  padding-top: 20px;
}
#webcrumbs .text-center {
  text-align: center;
}
#webcrumbs .font-title {
  font-family:
      Lato,
      ui-sans-serif,
      system-ui,
      sans-serif,
      Apple Color Emoji,
      Segoe UI Emoji,
      Segoe UI Symbol,
      Noto Color Emoji;
}
#webcrumbs .text-3xl {
  font-size: 30px;
  line-height: 36px;
}
#webcrumbs .text-sm {
  font-size: 14px;
  line-height: 21px;
}
#webcrumbs .text-neutral-700 {
  --tw-text-opacity: 1;
  color: rgb(103 103 103 / var(--tw-text-opacity));
}
#webcrumbs .text-neutral-800 {
  --tw-text-opacity: 1;
  color: rgb(84 84 84 / var(--tw-text-opacity));
}
#webcrumbs .text-neutral-900 {
  --tw-text-opacity: 1;
  color: rgb(70 70 70 / var(--tw-text-opacity));
}
#webcrumbs .shadow-md {
  --tw-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1),
  0 2px 4px -2px rgba(0, 0, 0, 0.1);
  --tw-shadow-colored: 0 4px 6px -1px var(--tw-shadow-color),
  0 2px 4px -2px var(--tw-shadow-color);
  box-shadow: var(--tw-ring-offset-shadow, 0 0 #0000),
  var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow);
}
#webcrumbs {
  font-family: Open Sans !important;
  font-size: 16px !important;
}
#webcrumbs :is(.bg-neutral-200) {
  color: rgba(0, 0, 0, 0.9) !important;
}
#webcrumbs .hover\:underline:hover {
  text-decoration-line: underline;
}

</style>