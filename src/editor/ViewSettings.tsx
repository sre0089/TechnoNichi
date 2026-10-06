import type { Preferences } from '../domain/model';
import { Button } from '../components/ui/button';
import { DialogClose } from '../components/ui/dialog';
import { NativeSelect } from '../components/ui/field';

export function PageSizeSelect({
  zoom,
  onChange,
  disabled,
  id,
}: {
  zoom: number;
  onChange: (zoom: number) => void;
  disabled?: boolean;
  id?: string;
}) {
  return (
    <NativeSelect
      id={id}
      aria-label="Page size"
      value={zoom}
      disabled={disabled}
      onChange={(event) => onChange(Number(event.target.value))}
    >
      <option value={0.85}>Small</option>
      <option value={1}>Comfortable</option>
      <option value={1.15}>Large</option>
    </NativeSelect>
  );
}

export function ViewSettings({
  preferences,
  change,
  moving,
}: {
  preferences: Preferences;
  change: (changes: Partial<Pick<Preferences, 'zoom' | 'toolbarSide'>>) => void;
  moving: boolean;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-start gap-2">
        <label
          htmlFor="settings-page-size"
          className="block text-xs font-semibold"
        >
          Page size
        </label>
        <p className="m-0 text-xs leading-relaxed text-ui-muted">
          Choose how much space your book takes on screen.
        </p>
        <PageSizeSelect
          id="settings-page-size"
          zoom={preferences.zoom}
          onChange={(zoom) => change({ zoom })}
          disabled={moving}
        />
      </div>
      <fieldset className="m-0 min-w-0 border-0 p-0" disabled={moving}>
        <legend className="mb-3 text-xs font-semibold">
          Controls position
        </legend>
        <div className="flex flex-col gap-3">
          <p className="m-0 text-xs leading-relaxed text-ui-muted">
            Keep the view controls on the side you prefer.
          </p>
          <div className="flex gap-2">
            {(['left', 'right'] as const).map((side) => (
              <Button
                key={side}
                aria-pressed={preferences.toolbarSide === side}
                variant={
                  preferences.toolbarSide === side ? 'primary' : 'secondary'
                }
                onClick={() => change({ toolbarSide: side })}
              >
                {side === 'left' ? 'Left side' : 'Right side'}
              </Button>
            ))}
          </div>
        </div>
      </fieldset>
      <p className="m-0 rounded-control bg-wash/60 p-3 text-xs leading-relaxed text-ui-muted">
        Your preferences apply as you choose and stay with this browser.
      </p>
      <div className="flex justify-end">
        <DialogClose asChild>
          <Button variant="primary">Done</Button>
        </DialogClose>
      </div>
    </div>
  );
}
