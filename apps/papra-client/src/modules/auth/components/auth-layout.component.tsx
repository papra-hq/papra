import type { ParentComponent } from 'solid-js';

export const AuthLayout: ParentComponent = (props) => {
  return (
    <div class="flex justify-center h-screen">

      {/* <div class="hidden xl:block flex-grow-1 p-8">
        <div class="h-full w-full bg-card rounded-lg border bg-[linear-gradient(to_right,#80808015_1px,transparent_1px),linear-gradient(to_bottom,#80808015_1px,transparent_1px)] bg-[size:48px_48px]">
        </div>
      </div> */}
      <div class="flex-grow-1 max-w-60%">
        {props.children}
      </div>

    </div>
  );
};
