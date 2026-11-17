<script>
  import { editor } from './lib/editor.svelte.js';
  import Home from './components/Home.svelte';
  import Workspace from './components/Workspace.svelte';

  let view = $state('home');
  let refreshKey = $state(0);

  $effect(() => {
    if (editor.project) view = 'workspace';
    else view = 'home';
  });

  function backHome() {
    editor.project = null;
    refreshKey++;
  }
</script>

{#if view === 'home'}
  <Home key={refreshKey} />
{:else}
  <Workspace onBack={backHome} />
{/if}

{#if editor.busy}
  <div class="busy-bar" aria-hidden="true"></div>
{/if}
{#if editor.toast}
  <div class="toast">{editor.toast}</div>
{/if}
