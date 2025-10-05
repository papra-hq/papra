import type { Component, ComponentProps } from 'solid-js';
import { mergeProps, splitProps } from 'solid-js';
import { cn } from '@/modules/shared/style/cn';

type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const sizes: Record<Size, { radius: number; strokeWidth: number }> = {
  xs: { radius: 15, strokeWidth: 4 },
  sm: { radius: 19, strokeWidth: 4 },
  md: { radius: 32, strokeWidth: 6 },
  lg: { radius: 52, strokeWidth: 8 },
  xl: { radius: 80, strokeWidth: 10 },
};

type ProgressCircleProps = ComponentProps<'div'> & {
  value?: number;
  size?: Size;
  radius?: number;
  strokeWidth?: number;
  showAnimation?: boolean;
};

const ProgressCircle: Component<ProgressCircleProps> = (rawProps) => {
  const props = mergeProps({ size: 'md' as Size, showAnimation: true }, rawProps);
  const [local, others] = splitProps(props, [
    'class',
    'children',
    'value',
    'size',
    'radius',
    'strokeWidth',
    'showAnimation',
  ]);

  const value = () => getLimitedValue(local.value);
  const radius = () => local.radius ?? sizes[local.size].radius;
  const strokeWidth = () => local.strokeWidth ?? sizes[local.size].strokeWidth;
  const normalizedRadius = () => radius() - strokeWidth() / 2;
  const circumference = () => normalizedRadius() * 2 * Math.PI;
  const strokeDashoffset = () => (value() / 100) * circumference();
  const offset = () => circumference() - strokeDashoffset();

  return (
    <div class={cn('flex flex-col items-center justify-center', local.class)} {...others}>
      <svg
        width={radius() * 2}
        height={radius() * 2}
        viewBox={`0 0 ${radius() * 2} ${radius() * 2}`}
        class="-rotate-90"
        aria-hidden="true"
      >
        <circle
          r={normalizedRadius()}
          cx={radius()}
          cy={radius()}
          stroke-width={strokeWidth()}
          fill="transparent"
          stroke=""
          stroke-linecap="round"
          class={cn('stroke-secondary transition-colors ease-linear')}
        />
        {value() >= 0
          ? (
              <circle
                r={normalizedRadius()}
                cx={radius()}
                cy={radius()}
                stroke-width={strokeWidth()}
                stroke-dasharray={`${circumference()} ${circumference()}`}
                stroke-dashoffset={offset()}
                fill="transparent"
                stroke=""
                stroke-linecap="round"
                class={cn(
                  'stroke-primary transition-colors ease-linear',
                  local.showAnimation ? 'transition-all duration-300 ease-in-out' : '',
                )}
              />
            )
          : null}
      </svg>
      <div class={cn('absolute flex')}>{local.children}</div>
    </div>
  );
};

function getLimitedValue(input: number | undefined) {
  if (input === undefined) {
    return 0;
  } else if (input > 100) {
    return 100;
  }
  return input;
}

export { ProgressCircle };
