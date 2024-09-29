import { toast } from "vue3-toastify";

export const notify = (msg: string) => {
  toast(msg, {
    autoClose: 2000,
  });
};
