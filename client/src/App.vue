<!--
  ─── src/App.vue ──────────────────────────────────────────────────────────────
  This is the ROOT component — the outermost wrapper of the entire application.
  Every other component (NavBar, Dashboard, TaskList, etc.) will eventually
  be nested somewhere inside this one.

  A Vue Single File Component (SFC) has up to three sections:
    <template> — the HTML structure to render
    <script>   — the JavaScript logic
    <style>    — component-scoped CSS (optional)
  ────────────────────────────────────────────────────────────────────────────
-->

<template>
  <!--
    This is the root element of the application.
    As you build out the app, you'll replace this placeholder content with
    your router view (<RouterView />) or layout components.
  -->
  <div id="app-root">
    <h1 class="text-2xl font-bold text-center p-8">
      Study Planner — Quintessential
    </h1>
    <p class="text-center text-gray-500">
      {{status}}
    </p>
    <button class="text-center" @click="upload()">Upload Hub File</button>
  </div>
</template>

<script setup>
// ─── <script setup> ──────────────────────────────────────────────────────────
// 'setup' is the modern Composition API syntax for Vue 3.
// Variables and functions declared here are automatically available in <template>.
// No need to return them from a setup() function.

// Example: import and use a Pinia store
// import { useUserStore } from './stores/user'
// const userStore = useUserStore()

var status = "User currently logged out. Upload Hub File to log in."

function upload(){
  status = "Hub Upload Successful!"
}

</script>
