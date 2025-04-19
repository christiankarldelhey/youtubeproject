<script setup lang="ts">
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import {
  LogOut,
  Settings,
  User,
} from 'lucide-vue-next'
import LoginDialog from './LoginDialog.vue';
import type { User as UserType } from "firebase/auth";
import { useMobile } from '../composables/useMobile';
import { ref } from 'vue';

const { isMobile } = useMobile();

const props = defineProps<{ user: UserType | null }>();

let type = 'Login';
const loginDialogOpen = ref(false);

const manageLoginDialog = (value: boolean, newType: string) => {
  type = newType;
  loginDialogOpen.value = value;
};

const emit = defineEmits(['close']);

</script>

<template>
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
      <Button
          class="absolute z-9999 px-2 right-3 top-4 flex h-10 w-10 items-center rounded-full
                    cursor-pointer bg-white text-primary hover:bg-white" >
          <User class="h-6 w-6" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent class="mr-4 mt-2 w-48 z-9999 bg-background ">
        <template v-if="props.user">
          <DropdownMenuLabel>{{ props.user?.email }}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem @click="">
              <Settings class="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator v-if="props.user" />
        <DropdownMenuItem>
          <LogOut class="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
        </template>
        <template v-else>
          <DropdownMenuGroup>
            <DropdownMenuItem @click="manageLoginDialog(true, 'Login')">
              Login
            </DropdownMenuItem>
            <DropdownMenuItem @click="manageLoginDialog(true, 'Sign up')">
              Sign Up
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </template>
      </DropdownMenuContent>
    </DropdownMenu>
  <LoginDialog 
    :open="loginDialogOpen" 
    @close="manageLoginDialog(false, 'Login')"
    :type="type" />
</template>