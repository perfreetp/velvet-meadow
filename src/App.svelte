<script lang="ts">
  import TopBar from './components/TopBar.svelte';
  import EditorCanvas from './components/EditorCanvas.svelte';
  import SidePanel from './components/SidePanel.svelte';
  import ReviewPanel from './components/ReviewPanel.svelte';
  import StatusBar from './components/StatusBar.svelte';
</script>

<div class="app-shell">
  <TopBar />
  <EditorCanvas />
  <div class="right-rail">
    <div class="rail-section">
      <SidePanel />
    </div>
    <div class="rail-section review">
      <ReviewPanel />
    </div>
  </div>
  <StatusBar />
</div>

<style>
  .right-rail {
    grid-area: panel;
    display: flex;
    flex-direction: column;
    min-height: 0;
    background: var(--panel);
    border-left: 1px solid var(--border);
  }
  .rail-section {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: 10px 12px;
  }
  .rail-section.review {
    border-top: 1px solid var(--border);
    flex: 0 0 auto;
    max-height: 46%;
  }
</style>
