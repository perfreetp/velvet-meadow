import { Show } from 'solid-js';
import { toast } from '../../store/app.js';

export default function Toast() {
  return (
    <Show when={toast()}>
      <div class={`toast ${toast().kind}`}>{toast().msg}</div>
    </Show>
  );
}
