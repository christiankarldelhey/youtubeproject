<script setup lang="ts">
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
import { ref } from 'vue';

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
  <template v-if="props.user">
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
      <Button
          class="absolute z-9999 px-2 right-1 top-5 flex items-center rounded-md
                    cursor-pointer bg-white text-primary hover:bg-white" >
          <User class="" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent class="mr-4 mt-2 w-48 z-9999 bg-background ">
        <DropdownMenuLabel>{{ user?.email }}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem @click="">
            <Settings class="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <LogOut class="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </template>

  <template v-else>
    <div class="absolute z-9999 right-5 top-5">
      <div class="flex flex-row justify-between gap-1">
        <Button 
        variant="default"
        @click="manageLoginDialog(true, 'Login')" 
        class="border text-sm bg-white text-primary border cursor-pointer">
        Login
      </Button>
      <Button 
        variant="default"
        @click="manageLoginDialog(true, 'Sign up')" 
        class="border text-sm bg-white text-primary border cursor-pointer">
        Sign Up
      </Button>
      </div>
    </div>
  </template>
  <LoginDialog 
    :open="loginDialogOpen" 
    @close="manageLoginDialog(false, 'Login')"
    :type="type" />
</template>