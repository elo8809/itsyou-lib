import { ReactNode } from 'react';
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  TransitionChild,
} from '@headlessui/react';
import Logo from './Logo';
import Icon from './Icon';

export default function MobileSideBar({
  children,
  open,
  setOpen,
  footer,
}: {
  children: ReactNode;
  open: boolean;
  setOpen: (v: boolean) => void;
  footer?: ReactNode;
}) {
  return (
    <Dialog
      open={open}
      onClose={setOpen}
      className="relative z-50 xl:hidden"
    >
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-white/80 transition-opacity duration-300 ease-linear data-[closed]:opacity-0"
      />

      <div className="fixed inset-0 flex ">
        <DialogPanel
          transition
          className="relative bg-white mr-16 flex w-full max-w-md flex-1 transform transition duration-300 ease-in-out data-[closed]:-translate-x-full"
        >
          <TransitionChild>
            <div className="absolute left-full top-0 flex w-16 h-16 justify-center duration-300 ease-in-out data-[closed]:opacity-0">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="-m-2.5 p-2.5"
              >
                <span className="sr-only">
                  Close sidebar
                </span>
                <Icon
                  name={'Close'}
                  aria-hidden="true"
                  className="size-6"
                />
              </button>
            </div>
          </TransitionChild>
          {/* Sidebar component, swap this element with another sidebar if you like */}
          <div className="flex grow flex-col gap-y-5 overflow-y-auto">
            <div className="flex h-16 shrink-0 items-center p-6">
              <Logo />
            </div>
            <div className="flex min-h-0 flex-1 flex-col px-8 pb-6">
              <div className="flex-1">{children}</div>
              {footer && (
                <div className="mt-auto border-t border-gray-200 pt-4">
                  {footer}
                </div>
              )}
            </div>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
