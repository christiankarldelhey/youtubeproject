<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/shared/ui/shadcn/dialog'
import { Input } from '@/shared/ui/shadcn/input'
import { Button } from '@/shared/ui/shadcn/button'
import { validateEmail } from '@/utils/utils'
import strings from '@/locales/en'
import { useAuthSession } from '../model/use-auth-session'

const props = defineProps<{
  open: boolean
  type: string
}>()

const emit = defineEmits<{
  close: []
}>()

const email = ref('')
const emailError = ref('')
const { sendLoginLink, completeSignIn, user } = useAuthSession()

const handleLogin = async () => {
  emailError.value = ''

  if (!validateEmail(email.value)) {
    emailError.value = strings.email_invalid
    return
  }

  await sendLoginLink(email.value)
  emit('close')
  alert(strings.login_link_sent)
}

watch(email, () => {
  emailError.value = ''
})

watch(user, (newUser) => {
  if (newUser) {
    emit('close')
  }
})

onMounted(() => {
  void completeSignIn()
})
</script>

<template>
  <Dialog :open="open" @update:open="emit('close')">
    <DialogContent class="bg-background max-w-sm rounded-lg p-6 shadow-lg">
      <DialogHeader>
        <div class="flex flex-row gap-2">
          <DialogTitle class="pt-1">
            {{ props.type === 'Sign up' ? strings.sign_up_title : strings.login_title }}
          </DialogTitle>
        </div>
        <DialogClose class="absolute right-2 top-2 cursor-pointer text-gray-500 hover:text-gray-800" />
      </DialogHeader>

      <div>
        <Input
          v-model="email"
          type="email"
          :placeholder="strings.email_placeholder"
          class="mt-5 w-full"
        />
        <p v-if="emailError" class="mt-1 text-sm text-red-500">
          {{ emailError }}
        </p>
        <Button @click="handleLogin" class="mt-5 w-full">
          {{ strings.send_login_link }}
        </Button>
      </div>
    </DialogContent>
  </Dialog>
</template>
