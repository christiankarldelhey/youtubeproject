<script setup lang="ts">
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { ref, onMounted, watch, defineProps, defineEmits } from 'vue';
import { useAuth } from '@/composables/useAuth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { validateEmail } from '@/utils/utils';
import strings from '../locales/en';

const props = defineProps<{
  open: boolean;
  type: string;
}>();

const emit = defineEmits(['close']);

const email = ref('');
const emailError = ref('');
const { sendLoginLink, completeSignIn, user } = useAuth();

const handleLogin = async () => {
  emailError.value = '';

  if (!validateEmail(email.value)) {
    emailError.value = strings.email_invalid;
    return;
  }

  await sendLoginLink(email.value);
  emit('close');
  alert(strings.login_link_sent);
};

watch(email, () => {
  emailError.value = '';
});

watch(user, (newUser) => {
  if (newUser) emit('close');
});

onMounted(() => {
  completeSignIn();
});
</script>

<template>
  <Dialog :open="open" @update:open="emit('close')">
    <DialogContent class="bg-background max-w-sm p-6 shadow-lg rounded-lg">
      <DialogHeader>
        <div class="flex flex-row gap-2">
          <DialogTitle class="pt-1">
            {{ props.type === 'Sign up' ? strings.sign_up_title : strings.login_title }}
          </DialogTitle>
        </div>
        <DialogClose class="absolute top-2 right-2 cursor-pointer text-gray-500 hover:text-gray-800" />
      </DialogHeader>

      <div>
        <Input
          v-model="email"
          type="email"
          :placeholder="strings.email_placeholder"
          class="w-full mt-5"
        />
        <p v-if="emailError" class="text-red-500 text-sm mt-1">
          {{ emailError }}
        </p>
        <Button @click="handleLogin" class="w-full mt-5">
          {{ strings.send_login_link }}
        </Button>
      </div>
    </DialogContent>
  </Dialog>
</template>
