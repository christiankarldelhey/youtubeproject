<script setup lang="ts">
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { ref, onMounted, watch, defineProps, defineEmits} from 'vue';
import { useAuth } from '@/composables/useAuth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { validateEmail } from '@/utils/utils';

const props = defineProps<{
  open: boolean;
  type: string;         
}>();

const email = ref('');
const emailError = ref('');
const { sendLoginLink, completeSignIn } = useAuth();

const handleLogin = async () => {
  emailError.value = '';

  if (!validateEmail(email.value)) {
    emailError.value = 'Please enter a valid email address.';
    return;
  }

  await sendLoginLink(email.value);
  alert('Login link sent! Check your email.');
};

watch(email, () => {
  emailError.value = '';    
});

onMounted(() => {
  completeSignIn();
});

const emit = defineEmits(['close']);
</script>

<template>
  <Dialog :open="open" @update:open="emit('close')">
    <DialogContent class="bg-background max-w-sm p-6 shadow-lg rounded-lg">
      <DialogHeader>
        <div class="flex flex-row gap-2">
        <DialogTitle class="pt-1">{{ props.type }}</DialogTitle>
      </div>
       <DialogClose 
        class="absolute top-2 right-2 cursor-pointer text-gray-500 hover:text-gray-800">
      </DialogClose>
      </DialogHeader>
      <div v-if="props.type === 'Sign up'">
        <Input
          v-model="email"
          type="email"
          placeholder="Enter your email"
          class="w-full mt-5"
        />
        <p v-if="emailError" class="text-red-500 text-sm mt-1">{{ emailError }}</p>
        <Button @click="handleLogin" class="w-full mt-5">Send Login link</Button>
      </div>
    </DialogContent>
  </Dialog>
</template>
