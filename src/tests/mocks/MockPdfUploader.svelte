<script lang="ts">
  export let onPdfParsed: (event: { text: string; filename: string }) => void;
  export let onPdfError: (event: { error: string }) => void;
  export let onLoadDocument: (event: { documentId: string }) => void;

  function triggerParsed() {
    if (onPdfParsed) {
      onPdfParsed({ text: "Mock PDF Text", filename: "test.pdf" });
    }
  }

  function triggerError() {
    if (onPdfError) {
      onPdfError({ error: "Mock Error" });
    }
  }

  function triggerLoad() {
    if (onLoadDocument) {
      onLoadDocument({ documentId: "existing-doc" });
    }
  }
</script>

<div data-testid="mock-uploader">
  <button data-testid="trigger-parsed" on:click={triggerParsed}
    >Trigger Parsed</button
  >
  <button data-testid="trigger-error" on:click={triggerError}
    >Trigger Error</button
  >
  <button data-testid="trigger-load" on:click={triggerLoad}>Trigger Load</button
  >
</div>
