const form = document.getElementById("clientInquiryForm");

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const submitBtn = document.getElementById("submitBtn");
    const loading = document.getElementById("formLoading");
    const success = document.getElementById("formSuccess");
    const error = document.getElementById("formError");

    loading.hidden = false;
    success.hidden = true;
    error.hidden = true;
    submitBtn.disabled = true;

    const formData = new FormData(form);

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData
      });

      const result = await response.json();

      loading.hidden = true;

      if (result.success) {
        success.hidden = false;
        form.reset();
      } else {
        error.hidden = false;
      }
    } catch (err) {
      loading.hidden = true;
      error.hidden = false;
    }

    submitBtn.disabled = false;
  });
}