const navLinks = document.querySelectorAll(".side_nav ul li a");
const pages = document.querySelectorAll(".page");

navLinks.forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();

    // Toggle active tab
    navLinks.forEach((item) => item.classList.remove("active"));
    link.classList.add("active");

    // Toggle active page
    const pageId = link.dataset.page;

    pages.forEach((page) => {
      page.classList.remove("active");
    });

    document.getElementById(pageId).classList.add("active");
  });
});

document.querySelectorAll(".tabs").forEach((tabGroup) => {
  const tabs = tabGroup.querySelectorAll(".tab");
  const contents = tabGroup.parentElement.querySelectorAll(".tab-content");

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      // remove active from all tabs in this group
      tabs.forEach((t) => t.classList.remove("active"));
      // hide all content in this container
      contents.forEach((c) => c.classList.remove("active"));

      // activate clicked tab
      tab.classList.add("active");
      const contentId = tab.dataset.tab;
      const content = tabGroup.parentElement.querySelector(`#${contentId}`);
      if (content) content.classList.add("active");
    });
  });
});
