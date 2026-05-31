<template>
  <div class="hidden" />
</template>

<script setup lang="ts">
import {useDialog, useMessage, useNotification} from 'naive-ui'

const message = useMessage()
const dialog = useDialog()
const notification = useNotification()

if (import.meta.client) {
  const w = window as any
  w.$message = message
  w.$dialog = dialog
  w.$notification = notification
}
</script>
