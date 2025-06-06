document.addEventListener('DOMContentLoaded', function() {

    // Optional: Preloader
    const preloader = document.getElementById('preloader');
    if (preloader) {
        window.addEventListener('load', () => {
            setTimeout(() => { // Ensure a minimum display time for preloader
                 preloader.style.opacity = '0';
                 setTimeout(() => preloader.style.display = 'none', 500); // Wait for fade out
            }, 500); // Minimum 0.5 seconds
        });
    }

    // Initialize AOS (Animate on Scroll)
    AOS.init({
        duration: 800,
        once: true,
        offset: 50,
    });

    // Footer: Set Current Year
    const currentYearSpan = document.getElementById('currentYear');
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }

    // Animated Counters for Stats Section
    function animateCounter(element, targetValueStr, duration = 2000) {
        if (!element) return;
        
        const isPlus = String(targetValueStr).includes('+');
        const numericTarget = parseInt(String(targetValueStr).replace(/\D/g, ''), 10);

        if (isNaN(numericTarget)) {
            element.textContent = targetValueStr; // If not a number (e.g. already contains text), set directly
            return;
        }
        
        let startValue = 0;
        const increment = numericTarget / (duration / 16); // Target ~60 fps

        function updateCounter() {
            startValue += increment;
            if (startValue < numericTarget) {
                element.textContent = Math.ceil(startValue).toLocaleString() + (isPlus ? "+" : "");
                requestAnimationFrame(updateCounter);
            } else {
                element.textContent = numericTarget.toLocaleString() + (isPlus ? "+" : "");
            }
        }
        updateCounter();
    }

    const statsSection = document.getElementById('stats');
    if (statsSection) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    document.querySelectorAll('.stats-section [id^="stats-"]').forEach(el => {
                        animateCounter(el, el.textContent);
                    });
                    observer.unobserve(statsSection); // Animate only once per page load
                }
            });
        }, { threshold: 0.3 }); // Trigger when 30% of the section is visible
        observer.observe(statsSection);
    }

    // Function to format date strings
    function formatDate(dateStr) {
        const dateObj = new Date(dateStr);
        return `${dateObj.getDate().toString().padStart(2, '0')}-${(dateObj.getMonth() + 1).toString().padStart(2, '0')}-${dateObj.getFullYear()}`;
    }

    // Function to create an event/notice card (used by homepage snippet and main events page)
    function createNoticeCard(item, colClasses = 'col-md-6 col-lg-4 mb-4') {
        const col = document.createElement('div');
        col.className = colClasses;
        col.setAttribute('data-aos', 'fade-up');
        col.setAttribute('id', item.id); // Add ID to the card wrapper

        let badges = '';
        if (item.isNew) badges += `<span class="badge bg-danger me-1">New</span>`;
        if (item.isUpcoming) badges += `<span class="badge bg-info me-1">Upcoming</span>`;
        if (item.category) badges += `<span class="badge bg-secondary">${item.category}</span>`;

        let displayDate = `Date: ${formatDate(item.date)}`;
        if (item.endDate) displayDate = `Dates: ${formatDate(item.date)} to ${formatDate(item.endDate)}`;
        if (item.time) displayDate += ` <br class="d-none d-md-block">Time: ${item.time}`;
        if (item.venue) displayDate += ` <br class="d-none d-md-block">Venue: ${item.venue}`;

        col.innerHTML = `
            <div class="card event-card h-100">
                ${item.image ? `<a href="${item.link || '#'}" class="text-decoration-none"><img src="${item.image}" class="card-img-top" alt="${item.title}"></a>` : ''}
                <div class="card-body d-flex flex-column">
                    <div>${badges}</div>
                    <h5 class="card-title mt-2">${item.title}</h5>
                    <p class="card-text text-muted small">${displayDate}</p>
                    <p class="card-text description flex-grow-1">${item.description.substring(0, 120)}${item.description.length > 120 ? '...' : ''}</p>
                    ${item.link ? `<a href="${item.link}" class="btn btn-sm btn-outline-primary mt-auto align-self-start">Read More / Register</a>` : ''}
                </div>
            </div>
        `;
        return col;
    }

    // News Ticker Data Loading (for index.html)
    const newsTickerList = document.getElementById('news-ticker-list');
    if (newsTickerList) {
        fetch('data/notices.json')
            .then(response => {
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return response.json();
            })
            .then(data => {
                if (data && data.length > 0) {
                    newsTickerList.innerHTML = ''; // Clear loading/placeholder
                    const relevantNotices = data
                        .sort((a,b) => new Date(b.date) - new Date(a.date)) // Sort by date, newest first
                        .filter(item => item.isNew || item.isUpcoming || item.type === "Notice")
                        .slice(0, 8); // Show up to 8 items

                    relevantNotices.forEach(notice => {
                        const li = document.createElement('li');
                        const a = document.createElement('a');
                        // Link to specific item on events-notices.html or its own link if provided
                        a.href = notice.link && (notice.link.startsWith('http') || notice.link.includes('.html')) ? notice.link : `events-notices.html#${notice.id}`;
                        a.textContent = notice.title;

                        if (notice.isNew && !notice.isUpcoming) { // Prioritize "Upcoming" if both are true
                            const newBadge = document.createElement('span');
                            newBadge.className = 'badge bg-warning text-dark ms-2';
                            newBadge.textContent = 'New';
                            a.appendChild(newBadge);
                        } else if (notice.isUpcoming) {
                            const upcomingBadge = document.createElement('span');
                            upcomingBadge.className = 'badge bg-info text-dark ms-2';
                            upcomingBadge.textContent = 'Upcoming';
                            a.appendChild(upcomingBadge);
                        }
                        li.appendChild(a);
                        newsTickerList.appendChild(li);
                    });
                    
                    // Adjust animation if content is too short
                    const tickerWidth = newsTickerList.scrollWidth;
                    const containerWidth = newsTickerList.parentElement.offsetWidth;
                    if (tickerWidth <= containerWidth) {
                        newsTickerList.style.animationPlayState = 'paused'; 
                    } else {
                        const duration = tickerWidth / 50; // Adjust speed (50px per second approx)
                        newsTickerList.style.animationDuration = Math.max(20, duration) + 's';
                    }

                } else {
                    newsTickerList.innerHTML = '<li>No recent updates available.</li>';
                }
            })
            .catch(error => {
                console.error("Error fetching notices for ticker:", error);
                newsTickerList.innerHTML = '<li>Could not load updates.</li>';
            });
    }

    // Homepage Events/Notices Snippet Loading (for index.html)
    const homeNoticesListContainer = document.getElementById('home-notices-list');
    if (homeNoticesListContainer) {
        fetch("data/notices.json")
            .then(response => response.json())
            .then(data => {
                if (data && data.length > 0) {
                    homeNoticesListContainer.innerHTML = ''; // Clear placeholders
                    const sortedData = data.sort((a, b) => new Date(b.date) - new Date(a.date)); // Newest first
                    const itemsToShow = sortedData.slice(0, 3); // Show latest 3 items

                    itemsToShow.forEach(item => {
                        homeNoticesListContainer.appendChild(createNoticeCard(item));
                    });
                     AOS.refresh(); // Refresh AOS to apply animations to new elements
                } else {
                    homeNoticesListContainer.innerHTML = '<p class="text-center col-12">No recent events or notices to display.</p>';
                }
            })
            .catch(error => {
                console.error("Error fetching notices for homepage snippet:", error);
                homeNoticesListContainer.innerHTML = '<p class="text-center text-danger col-12">Could not load updates.</p>';
            });
    }
    
    // Full Events & Notices Page Data Loading (for events-notices.html)
    const eventsListFullContainer = document.getElementById('events-notices-full-list');
    if (eventsListFullContainer) {
        fetch('data/notices.json')
            .then(response => response.json())
            .then(data => {
                if (data && data.length > 0) {
                    eventsListFullContainer.innerHTML = ''; // Clear loading
                    data.sort((a,b) => new Date(b.date) - new Date(a.date)); // Sort by date, newest first

                    data.forEach(item => {
                        eventsListFullContainer.appendChild(createNoticeCard(item, 'col-lg-4 col-md-6 mb-4'));
                    });
                    AOS.refresh();
                } else {
                    eventsListFullContainer.innerHTML = '<p class="text-center col-12">No events or notices found.</p>';
                }
            })
            .catch(error => {
                console.error("Error fetching full events/notices:", error);
                eventsListFullContainer.innerHTML = '<p class="text-center text-danger col-12">Could not load events and notices.</p>';
            });
    }

   

    // Faculty Page: Filtering
    const facultyGrid = document.getElementById('faculty-grid');
    const facultyFilterButtons = document.querySelectorAll('.faculty-filter-buttons .btn');
    if (facultyGrid && facultyFilterButtons.length > 0) {
        const facultyMembers = Array.from(facultyGrid.querySelectorAll('.faculty-member-wrapper'));
        facultyFilterButtons.forEach(button => {
            button.addEventListener('click', function() {
                facultyFilterButtons.forEach(btn => {
                    btn.classList.remove('active', 'btn-primary');
                    btn.classList.add('btn-outline-primary');
                });
                this.classList.add('active', 'btn-primary');
                this.classList.remove('btn-outline-primary');
                const filterValue = this.getAttribute('data-filter');
                facultyMembers.forEach(member => {
                    member.style.display = 'none';
                    if (filterValue === '*' || member.getAttribute('data-department').toLowerCase() === filterValue.toLowerCase()) {
                        member.style.display = '';
                    }
                });
                AOS.refreshHard();
            });
        });
    }

    // Smooth scroll for anchor links (optional, Bootstrap handles some of this for navs)
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const hrefTarget = this.getAttribute('href');
            // Ensure it's not a link for a Bootstrap component (like tabs or carousel controls)
            if (hrefTarget.length > 1 && !this.getAttribute('data-bs-toggle') && !this.getAttribute('data-bs-target')) {
                const targetElement = document.querySelector(hrefTarget);
                if (targetElement) {
                    e.preventDefault();
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start' // Aligns to top, or 'center'
                    });
                }
            }
        });
    });

    // Sticky Navbar: Change background on scroll
    const mainNavbar = document.querySelector('.navbar.fixed-top');
    if (mainNavbar) {
        // Function to handle navbar style based on scroll
        const handleNavbarScroll = () => {
            if (window.scrollY > 50) {
                mainNavbar.classList.add('bg-white', 'shadow-sm');
                mainNavbar.classList.remove('navbar-dark'); // Assuming it might be dark if hero is dark
                mainNavbar.classList.add('navbar-light');
            } else {
                // This logic depends on your initial navbar state (transparent or solid)
                // If it's meant to be transparent over a hero, you'd remove bg-white here.
                // For this project, it's always light/white, so this part might be minimal.
                mainNavbar.classList.remove('shadow-sm');
                // If you want it transparent initially and navbar-light is default:
                // mainNavbar.classList.remove('bg-white');
            }
        };
        // Initial check in case page is loaded already scrolled
        handleNavbarScroll();
        // Add scroll listener
        window.addEventListener('scroll', handleNavbarScroll);
    }
});



/**
 * Advanced JavaScript for the Yeshwant Mahavidhyalaya Website
 *
 * Features:
 * - Object-Oriented structure using a main App class.
 * - Class-based, async/await form handling for robustness.
 * - Performance optimization with a debounced scroll listener.
 * - Dynamic content loading and component initialization.
 *
 * @version 2.0
 */

// --- UTILITIES ---

/**
 * Debounce function to limit the rate at which a function gets called.
 * @param {Function} func The function to debounce.
 * @param {number} delay The delay in milliseconds.
 * @returns {Function} The debounced function.
 */
const debounce = (func, delay = 15) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
};


// --- FORM HANDLING CLASS ---

class FormHandler {
  /**
   * Handles submission for a specific form.
   * @param {string} formId The ID of the form element.
   * @param {string} apiEndpoint The backend API endpoint URL for submission.
   */
  constructor(formId, apiEndpoint) {
    this.form = document.getElementById(formId);
    if (!this.form) return;

    this.apiEndpoint = apiEndpoint;
    this.submitButton = this.form.querySelector('button[type="submit"], input[type="submit"]');
    // Finds the feedback div associated with the form via a data attribute.
    this.feedbackDiv = document.querySelector(`[data-feedback-for="${formId}"]`); 
    this.originalButtonHTML = this.submitButton ? this.submitButton.innerHTML : '';
    
    this.init();
  }

  init() {
    this.form.addEventListener('submit', (event) => this.handleSubmit(event));
  }

  setLoadingState(isLoading) {
    if (!this.submitButton) return;
    if (isLoading) {
      this.submitButton.disabled = true;
      this.submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Sending...';
    } else {
      this.submitButton.disabled = false;
      this.submitButton.innerHTML = this.originalButtonHTML;
    }
  }

  displayFeedback(message, type = 'danger') {
    if (!this.feedbackDiv) return;
    this.feedbackDiv.innerHTML = `<div class="alert alert-${type} alert-dismissible fade show mt-3" role="alert">
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    </div>`;
  }

  async handleSubmit(event) {
    event.preventDefault();
    this.setLoadingState(true);
    if (this.feedbackDiv) this.feedbackDiv.innerHTML = '';

    const formData = new FormData(this.form);
    const data = Object.fromEntries(formData.entries());

    // --- Client-side validation ---
    for (const field of this.form.querySelectorAll('[required]')) {
      if (!field.value.trim()) {
        this.displayFeedback(`Please fill in the '${field.labels[0].textContent.replace('*','').trim()}' field.`);
        this.setLoadingState(false);
        return;
      }
    }
    
    try {
      // --- This is the ACTUAL FETCH LOGIC to be used with a real backend ---
      // const response = await fetch(this.apiEndpoint, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(data),
      // });

      // if (!response.ok) {
      //   const errorData = await response.json();
      //   throw new Error(errorData.message || 'An unknown server error occurred.');
      // }
      
      // const result = await response.json();
      // this.displayFeedback(result.message, 'success');

      // --- SIMULATION (for testing without a backend) ---
      console.log(`Simulating submission to: ${this.apiEndpoint}`, data);
      await new Promise(resolve => setTimeout(resolve, 1500));
      this.displayFeedback('Your inquiry has been sent successfully! (This is a frontend demo)', 'success');
      // --- END SIMULATION ---
      
      this.form.reset();

    } catch (error) {
      console.error('Submission Error:', error);
      this.displayFeedback(error.message || 'An unexpected error occurred. Please try again.');
    } finally {
      this.setLoadingState(false);
    }
  }
}


// --- MAIN APP CLASS ---

class App {
  constructor() {
    this.navbar = document.querySelector('.navbar.fixed-top');
  }

  init() {
    this.initPreloader();
    this.initAOS();
    this.initDynamicContent();
    this.initCounters();
    this.initFilters();
    this.initForms();
    this.initFacultyAccordion();
    this.initIsotopeGallery();
    this.initFooter();
    this.addEventListeners();
  }
  
  addEventListeners() {
    if (this.navbar) {
      window.addEventListener('scroll', debounce(() => this.handleNavbarScroll()));
      this.handleNavbarScroll();
    }
  }

  handleNavbarScroll() {
    // This adds a 'scrolled' class to the navbar after scrolling down.
    // You can use .navbar.scrolled in your CSS to add a shadow or change background.
    if (window.scrollY > 50) {
      this.navbar.classList.add('scrolled');
    } else {
      this.navbar.classList.remove('scrolled');
    }
  }
  
  initPreloader() {
    const preloader = document.getElementById('preloader');
    if (preloader) {
      window.addEventListener('load', () => {
        preloader.style.opacity = '0';
        setTimeout(() => preloader.style.display = 'none', 500);
      });
    }
  }
  initFacultyAccordion() {
        const facultyAccordion = document.getElementById("facultyAccordion");
        if (!facultyAccordion) return;

        facultyAccordion.addEventListener('shown.bs.collapse', event => {
            const header = event.target.previousElementSibling;
            if(header) {
                const headerOffset = 100; // Offset for fixed navbar height + some space
                const elementPosition = header.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });
            }
        });
    }

     // ADD THIS ENTIRE NEW METHOD
    initIsotopeGallery() {
        const galleryGrid = document.querySelector('.gallery-grid');
        if (!galleryGrid) return;

        // Use imagesLoaded to ensure all images are loaded before initializing Isotope
        imagesLoaded(galleryGrid, function () {
            const iso = new Isotope(galleryGrid, {
                itemSelector: '.grid-item',
                percentPosition: true,
                masonry: {
                    columnWidth: '.grid-sizer'
                }
            });

            const filterButtons = document.querySelectorAll('#gallery-filter-buttons .btn');
            filterButtons.forEach(button => {
                button.addEventListener('click', () => {
                    filterButtons.forEach(btn => btn.classList.remove('active'));
                    button.classList.add('active');
                    
                    const filterValue = button.getAttribute('data-filter');
                    iso.arrange({ filter: filterValue });
                });
            });
        });
    }
  
  initAOS() {
    AOS.init({
      duration: 800,
      once: true,
      offset: 50,
    });
  }
  
  initFooter() {
    const currentYearSpan = document.getElementById('currentYear');
    if (currentYearSpan) {
      currentYearSpan.textContent = new Date().getFullYear();
    }
  }

  initDynamicContent() {
    this.populateNotices('home-notices-list', 3);
    this.populateNotices('events-notices-full-list');
    this.initNewsTicker();
  }

  async initNewsTicker() {
    const tickerList = document.getElementById('news-ticker-list');
    if (!tickerList) return;

    try {
      const response = await fetch('data/notices.json');
      if (!response.ok) throw new Error('Failed to load notices.');
      const data = await response.json();
      
      if (data && data.length > 0) {
        tickerList.innerHTML = '';
        const relevantNotices = data.sort((a,b) => new Date(b.date) - new Date(a.date)).slice(0, 8);
        relevantNotices.forEach(notice => {
          const link = notice.link || `events-notices.html#${notice.id}`;
          tickerList.innerHTML += `<li><a href="${link}">${notice.title}</a></li>`;
        });
      } else {
        tickerList.innerHTML = '<li>No recent updates available.</li>';
      }
    } catch (error) {
      console.error("Error fetching for ticker:", error);
      tickerList.innerHTML = '<li>Could not load updates.</li>';
    }
  }
  
  async populateNotices(containerId, itemCount = null) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '<div class="col-12 text-center"><div class="spinner-border text-primary" role="status"></div></div>';
    
    try {
      const response = await fetch('data/notices.json');
      if (!response.ok) throw new Error('Failed to load data.');
      const data = await response.json();

      container.innerHTML = '';
      if (data && data.length > 0) {
        const sortedData = data.sort((a,b) => new Date(b.date) - new Date(a.date));
        const itemsToShow = itemCount ? sortedData.slice(0, itemCount) : sortedData;
        itemsToShow.forEach(item => container.innerHTML += this.createNoticeCardHTML(item));
        AOS.refresh();
      } else {
        container.innerHTML = '<p class="text-center col-12">No updates found.</p>';
      }
    } catch (error) {
      console.error(`Error populating #${containerId}:`, error);
      container.innerHTML = '<p class="text-center text-danger col-12">Could not load updates.</p>';
    }
  }
  
  createNoticeCardHTML(item) {
    const badges = `${item.isNew ? '<span class="badge bg-danger me-1">New</span>' : ''}${item.isUpcoming ? '<span class="badge bg-info me-1">Upcoming</span>' : ''}${item.category ? `<span class="badge bg-secondary">${item.category}</span>` : ''}`;
    const link = item.link || `events-notices.html#${item.id}`;
    const description = item.description ? item.description.substring(0, 120) + (item.description.length > 120 ? '...' : '') : '';
    return `
      <div class="col-lg-4 col-md-6 mb-4" data-aos="fade-up" id="${item.id}">
        <div class="card event-card h-100">
          ${item.image ? `<a href="${link}"><img src="${item.image}" class="card-img-top" alt="${item.title}" loading="lazy"></a>` : ''}
          <div class="card-body d-flex flex-column">
            <div>${badges}</div>
            <h5 class="card-title mt-2">${item.title}</h5>
            <p class="card-text description flex-grow-1">${description}</p>
            <a href="${link}" class="btn btn-sm btn-outline-primary mt-auto align-self-start">Read More</a>
          </div>
        </div>
      </div>`;
  }

  initCounters() {
    const statsSection = document.getElementById('stats');
    if (!statsSection) return;

    const animateCounter = (el) => {
      const targetStr = el.dataset.target || el.textContent || '0';
      const isPlus = targetStr.includes('+');
      const target = parseInt(targetStr.replace(/\D/g, ''), 10);
      if (isNaN(target)) return;
      el.textContent = '0' + (isPlus ? '+' : '');

      let start = 0;
      const duration = 2000;
      const stepTime = 16;
      const steps = duration / stepTime;
      const increment = target / steps;
      
      const counter = () => {
        start += increment;
        if (start < target) {
          el.textContent = Math.ceil(start).toLocaleString() + (isPlus ? '+' : '');
          requestAnimationFrame(counter);
        } else {
          el.textContent = target.toLocaleString() + (isPlus ? '+' : '');
        }
      };
      counter();
    };

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          statsSection.querySelectorAll('[id^="stats-"]').forEach(animateCounter);
          obs.unobserve(statsSection);
        }
      });
    }, { threshold: 0.3 });
    observer.observe(statsSection);
  }

  initFilters() {
    const setupFilter = (buttonsSelector, gridSelector, itemSelector, categoryAttr) => {
      const grid = document.getElementById(gridSelector);
      const buttons = document.querySelectorAll(buttonsSelector);
      if (!grid || buttons.length === 0) return;

      buttons.forEach(button => {
        button.addEventListener('click', () => {
          buttons.forEach(btn => {
            btn.classList.remove('active', 'btn-primary');
            btn.classList.add('btn-outline-primary');
          });
          button.classList.add('active', 'btn-primary');
          button.classList.remove('btn-outline-primary');
          const filter = button.getAttribute(categoryAttr);
          grid.querySelectorAll(itemSelector).forEach(item => {
            item.style.display = (filter === '*' || item.getAttribute(categoryAttr) === filter) ? '' : 'none';
          });
          AOS.refreshHard();
        });
      });
    };
    
    setupFilter('.faculty-filter-buttons .btn', 'faculty-grid', '.faculty-member-wrapper', 'data-department');
  }

  initForms() {
    new FormHandler('admissionInquiryForm', 'YOUR_COLLEGE_ADMISSION_API_ENDPOINT_HERE');
    new FormHandler('contactForm', 'YOUR_COLLEGE_CONTACT_API_ENDPOINT_HERE');
  }
}

 
// --- APP INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
});



