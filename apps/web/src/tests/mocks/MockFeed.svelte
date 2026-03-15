<script lang="ts">
  let { initialIndex, initialProgress, documentId } = $props();
</script>

<div
  data-testid="mock-feed"
  data-initial-index={initialIndex}
  data-initial-progress={initialProgress}
>
  Feed for {documentId}
</div>
