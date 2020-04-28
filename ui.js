$(async function () {
  // cache some selectors we'll be using quite a bit
  const $allStoriesList = $("#all-articles-list");
  const $submitForm = $("#submit-form");
  const $filteredArticles = $("#filtered-articles");
  const $favoriteArticles = $("#favorited-articles");
  const $loginForm = $("#login-form");
  const $createAccountForm = $("#create-account-form");
  // **** added submit story and user profile selectors(// **** denotes Jeremiah's code)
  const $submitStoryForm = $("#submit-story-form");
  const $userProfile = $("#user-profile");
  // ****
  const $ownStories = $("#my-articles");
  const $navLogin = $("#nav-login");
  const $navLogOut = $("#nav-logout");
  // **** added variables for submit, favorites, mystories, and array for favorite ids
  const $userOptions = $(".user-options");
  const $navUser = $("#nav-user-profile");
  let $submitStory = $("#nav-user-submit");
  let $favorites = $("#nav-user-favorites");
  let $myStories = $("#nav-user-stories");
  // ****

  // global storyList variable
  let storyList = null;

  // global currentUser variable
  let currentUser = null;

  await checkIfLoggedIn();

  // **** checks screen size and makes nav bar responsive
  $(".dropdown").hide();
  $(".fa-bars").hide();

  checkScreenSize();
  $(window).resize(checkScreenSize);

  $(".fa-bars").on("click", function () {
    $(".dropdown").slideToggle();
  });

  // if logged in and screen is small, adds user links to hamburger dropdown
  function checkScreenSize() {
    if (currentUser && $("#options").css("display") === "none") {
      $(".fa-bars").show();
      $(".dropdown").append($(".user-options"));
    } else if (currentUser && $("#options").css("display") !== "none") {
      $(".fa-bars").hide();
      $("#options").append($(".user-options"));
    }
  }
  // ****

  /**
   * Event listener for logging in.
   *  If successfully we will setup the user instance
   */

  $loginForm.on("submit", async function (evt) {
    evt.preventDefault(); // no page-refresh on submit

    // grab the username and password
    let userInputs = {
      username: $("#login-username").val(),
      password: $("#login-password").val(),
    };
    // **** throws error if empty inputs
    try {
      checkForm(userInputs);
      // call the login static method to build a user instance
      // **** catches any error from api response
      try {
        const userInstance = await User.login(
          userInputs.username,
          userInputs.password
        );
        // set the global user to the user instance
        currentUser = userInstance;
        syncCurrentUserToLocalStorage();
        loginAndSubmitForm();
      } catch (err) {
        responseError(err, "Login");
      }
    } catch (err) {
      alert(err.message);
    }
  });

  // **** Event listener for submit story, automatically adds to DOM with generateStories
  $submitStoryForm.on("submit", async function (evt) {
    evt.preventDefault();
    let userInputs = {
      author: $("#author-name").val(),
      title: $("#story-title").val(),
      url: $("#story-url").val(),
    };
    try {
      checkForm(userInputs);

      const newStory = new Story({
        username: currentUser.username,
        author: userInputs.author,
        title: userInputs.title,
        url: userInputs.url,
      });
      try {
        if (currentUser) {
          await StoryList.addStory(currentUser, newStory);
        }
      } catch (err) {
        responseError(err, "Submit story");
      }
      $("#author-name").val("");
      $("#story-title").val("");
      $("#story-url").val("");
      $submitStoryForm.slideToggle();
      await generateStories();
      updateCurrentUser();
    } catch (err) {
      alert(err.message);
    }
  });
  // ****

  /**
   * Event listener for signing up.
   *  If successfully we will setup a new user instance
   */

  // **** checking input form for empty inputs
  function checkForm(inputs) {
    let inputKeys = Object.keys(inputs);
    for (let key of inputKeys) {
      if (!inputs[key]) {
        throw new EmptyInputError(key);
      }
    }
  }
  // ****

  // **** callback function if there is a api response error
  function responseError(error, type) {
    let responseMessage = error.response.data.error.message;
    if (responseMessage) {
      alert(responseMessage);
    } else {
      alert(`${type} error`);
    }
  }

  $createAccountForm.on("submit", async function (evt) {
    evt.preventDefault(); // no page refresh

    // grab the required fields
    // **** changed to object so keys and values can both be used in checkForm
    let inputs = {
      name: $("#create-account-name").val(),
      username: $("#create-account-username").val(),
      password: $("#create-account-password").val(),
    };

    // ****
    try {
      checkForm(inputs);

      let newUser;

      // call the create method, which calls the API and then builds a new user instance
      // **** catches response error
      try {
        newUser = await User.create(
          inputs.username,
          inputs.password,
          inputs.name
        );
        currentUser = newUser;
        syncCurrentUserToLocalStorage();
        loginAndSubmitForm();
      } catch (err) {
        responseError(err, "Create user");
      }
      // ****
    } catch (err) {
      alert(err.message);
    }
  });

  /**
   * Log Out Functionality
   */

  $navLogOut.on("click", async function () {
    // empty out local storage
    localStorage.clear();
    // refresh the page, clearing memory
    location.reload();
    $(".fa-bars").hide();
  });

  /**
   * Event Handler for Clicking Login
   */

  $navLogin.on("click", function () {
    // Show the Login and Create Account Forms
    $loginForm.slideToggle();
    $createAccountForm.slideToggle();
    $allStoriesList.toggle();
  });

  // *** Event Handler for Clicking username
  $navUser.on("click", function () {
    hideElements();
    $userProfile.show();
  });

  // **** Event Handler for Clicking Submit
  $submitStory.on("click", async function () {
    // Show the Submit Story Form and stories list
    hideElements();
    $allStoriesList.show();
    $submitStoryForm.slideToggle();
    $(".dropdown").hide();
  });

  // **** added event handler to favorites navbar link

  $favorites.on("click", function () {
    hideElements();
    $favoriteArticles.empty();
    // if user has any favorites, generate a list item with story on the page
    if (currentUser.favorites.length > 0) {
      currentUser.favorites.forEach((story) => {
        $favoriteArticles.append(generateStoryHTML(story));
      });
    } else {
      $favoriteArticles.html("No favorites added.");
    }
    $favoriteArticles.show();
    $(".dropdown").hide();
  });
  // ****

  // **** added event handler to my stories navbar link
  $myStories.on("click", function () {
    hideElements();
    $ownStories.empty();
    // if user has any favorites, generate a list item with story on the page
    if (currentUser.ownStories.length > 0) {
      currentUser.ownStories.forEach((story) => {
        $ownStories.append(generateStoryHTML(story));
      });
    } else {
      $ownStories.html("No stories added.");
    }
    $ownStories.children().prepend('<i class="fas fa-trash-alt"></i>');
    $ownStories.show();
    $(".dropdown").hide();
  });
  // ****

  // **** added trash icon for deleting my stories
  $("body").on("click", ".fa-trash-alt", async function (evt) {
    const id = $(evt.target).parent().attr("id");
    await StoryList.removeStory(id, currentUser.loginToken);
    $(evt.target).parent().remove();
    await updateCurrentUser();
  });
  // ****

  /**
   * Event handler for Navigation to Homepage
   */

  $("body").on("click", "#nav-all", async function () {
    hideElements();
    await generateStories();
    $allStoriesList.show();
  });

  /**
   * On page load, checks local storage to see if the user is already logged in.
   * Renders page information accordingly.
   */

  async function checkIfLoggedIn() {
    // let's see if we're logged in
    const token = localStorage.getItem("token");
    const username = localStorage.getItem("username");

    // if there is a token in localStorage, call User.getLoggedInUser
    //  to get an instance of User with the right details
    //  this is designed to run once, on page load
    currentUser = await User.getLoggedInUser(token, username);
    if (currentUser) {
      await showNavForLoggedInUser();
    }
    await generateStories();
  }

  // **** retrieves updated user data from api
  async function updateCurrentUser() {
    currentUser = await User.getLoggedInUser(
      currentUser.loginToken,
      currentUser.username
    );
  }
  // ***

  /**
   * A rendering function to run to reset the forms and hide the login info
   */

  async function loginAndSubmitForm() {
    // hide the forms for logging in and signing up
    $loginForm.hide();
    $createAccountForm.hide();

    // reset those forms
    $loginForm.trigger("reset");
    $createAccountForm.trigger("reset");

    // show the stories
    $allStoriesList.show();

    // update the navigation bar ****and add favorites icon listener****
    await showNavForLoggedInUser();
  }

  /**
   * A rendering function to call the StoryList.getStories static method,
   *  which will generate a storyListInstance. Then render it.
   */

  async function generateStories() {
    // get an instance of StoryList
    const storyListInstance = await StoryList.getStories();
    // update our global variable
    storyList = storyListInstance;
    // empty out that part of the page
    $allStoriesList.empty();

    // loop through all of our stories and generate HTML for them
    for (let story of storyList.stories) {
      const result = generateStoryHTML(story);
      $allStoriesList.append(result);
    }
  }

  /**
   * A function to render HTML for an individual Story instance
   */

  function generateStoryHTML(story) {
    let hostName = getHostName(story.url);
    let iconClass = "far fa-star";
    if (currentUser) {
      let favIds = currentUser.favorites.map((fav) => fav.storyId);
      if (favIds.includes(story.storyId)) {
        iconClass = "fas fa-star";
      }
    }
    // render story markup
    const storyMarkup = $(`
      <li id="${story.storyId}">
        <i class="${iconClass}"></i>
        <a class="article-link" href="${story.url}" target="a_blank">
          <strong>${story.title}</strong>
        </a>
        <small class="article-author">by ${story.author}</small>
        <small class="article-hostname ${hostName}">(${hostName})</small>
        <small class="article-username">posted by ${story.username}</small>
      </li>
    `);

    return storyMarkup;
  }

  // **** adds event listener to fav icons and calls callback function if user logged in
  $("body").on("click", ".fa-star", async function () {
    if (currentUser) {
      let $storyId = $(this).parent().attr("id");
      await favClick(this, $storyId);
    }
  });

  // **** callback function - adds or removes favorites with fav icon click
  async function favClick(icon, storyId) {
    $(icon).toggleClass("far fas");
    if ($(icon).hasClass("fas")) {
      await User.addFavorite(storyId, currentUser);
    } else {
      await User.removeFavorite(storyId, currentUser);
    }
    // updates currentUser data
    await updateCurrentUser();
  }
  // ****

  /* hide all elements in elementsArr */

  function hideElements() {
    const elementsArr = [
      $submitForm,
      $allStoriesList,
      $filteredArticles,
      $ownStories,
      $loginForm,
      $createAccountForm,
      // **** added favorite article, submit story, user profile hide
      $submitStoryForm,
      $favoriteArticles,
      $userProfile,
      // ****
    ];
    elementsArr.forEach(($elem) => $elem.hide());
  }

  async function showNavForLoggedInUser() {
    $navLogin.hide();
    $navLogOut.show();
    // **** added user option links, user profile info
    $userOptions.show();
    $navUser.show();
    $navUser.html(`${currentUser.username}`);
    updateUserProfile();
    $(".fa-bars").show();
    checkScreenSize();
    await generateStories();
  }

  // **** add user information to user profile
  function updateUserProfile() {
    // $('#profile-name)
    $("#show-name").html(` ${currentUser.name}`);
    $("#show-username").html(` ${currentUser.username}`);
    $("#show-date").html(` ${currentUser.createdAt.slice(0, 10)}`);
  }

  /* simple function to pull the hostname from a URL */

  function getHostName(url) {
    let hostName;
    if (url.indexOf("://") > -1) {
      hostName = url.split("/")[2];
    } else {
      hostName = url.split("/")[0];
    }
    if (hostName.slice(0, 4) === "www.") {
      hostName = hostName.slice(4);
    }
    return hostName;
  }

  /* sync current user information to localStorage */

  function syncCurrentUserToLocalStorage() {
    if (currentUser) {
      localStorage.setItem("token", currentUser.loginToken);
      localStorage.setItem("username", currentUser.username);
    }
  }
});
