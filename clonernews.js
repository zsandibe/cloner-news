let state = {};


let n = 15;
let latestID;
let timer;

let printMoreStories = false;
let pageSelection = "topstories";
const hackernewsURL = "https://hacker-news.firebaseio.com/v0";
let result = document.getElementById("result"); 



function fetchTopStoriesID() {


    clearInterval(timer);
    document.querySelector(".container").style.display = "none";

    if (pageSelection == "newstories") { fetchLatestID(); }

    return fetch(`${hackernewsURL}/${pageSelection}.json`)
        .then(response => response.json())
        .then(topStoriesID_array => fetchStories(topStoriesID_array)); 
}


function fetchStories(array) {

    let topStoriesID = array.slice(start, n + start); 
    let topStories = topStoriesID.map(id => { 
        return fetch(`${hackernewsURL}/item/${id}.json`)
            .then(response => response.json())
    });

    return Promise.all(topStories)
        .then(topStories => {
            state.stories = topStories 
            printStories(topStories)
        });
}


function printStories(topStories) {

 
    return topStories.map(story => {

                let userURL = `https://news.ycombinator.com/user?id=${story.by}`

                let comment;
                story.descendants == 1 ? comment = "comment" : comment = "comments"

                let HTMLtoInsert = `
        <div class="story" id="${story.id}">

            <h3 class="title"> ${story.url ?
                `<a href='${story.url}' target='_blank'> ${story.title} </a>`
                : `<a href="javascript:void(0)" onclick="toggleStoryText('${story.id}')"> ${story.title} </a>` }
            </h3>

            <span class='score'> ${story.score} </span> points by <a href='${userURL}' target='_blank' class='story-by'> ${story.by}</a>

                <div class="toggle-view">
                ${story.kids ?
                `<span onclick="fetchOrToggleComments('${story.kids}', '${story.id}')" class="comments"> ❯ show ${story.descendants} ${comment} </span>`
                : '' }
                </div>

                ${story.text ?
                `<div class="storyText" id="storyText-${story.id}" style="display:block"> <span style="font-size: 300%">“</span> ${story.text} <span style="font-size: 300%">”</span> </div>`
                : '' }

                <div id="comments-${story.id}" style="display:block">
                </div>

        </div>           
        `
        result.insertAdjacentHTML('beforeend', HTMLtoInsert);    
        printMoreStories = false;
    })
};


function toggleStoryText(storyID)
{
    let storyText = document.getElementsById(`storyText-${storyID}`);

    if(storyText.style.display == "block") { storyText.style.display = "none" }
    else { storyText.style.display = "block" }

}


function fetchComments(kids, storyID)
{
    let commentIDs = kids.split(",");

   
    let allComments = commentIDs.map(commentID => {
            return fetch(`${hackernewsURL}/item/${commentID}.json`)
                .then(response => response.json());
        });

    return Promise.all(allComments)     
        .then(comments => {
                state[storyID] = comments;
                printComments(comments, storyID);
            });
}


function fetchOrToggleComments(kids, storyID)
{
    function toggleAllComments(storyID)
    {
        let allComments = document.getElementById(`comments-${storyID}`);

        if(allComments.style.display == "block") { allComments.style.display = "none" }
        else { allComments.style.display = "block" }
    }
    state[storyID] ? toggleAllComments(storyID) : fetchComments(kids, storyID)
}


function toggleComment(commentID)
{
    let comment = document.getElementById(commentID);
    let toggle = document.getElementById(`toggle-${commentID}`);

    if(comment.style.display == "block") { comment.style.display = "none" }
    else { comment.style.display = "block" }
    
    if(toggle.innerHTML == '[ – ]') { toggle.innerHTML = '[ + ]' }
    else { toggle.innerHTML = '[ – ]' }
}


function printComments(comments, storyID)
{
    
    return comments.map(comment => {

        let userURL = `https://news.ycombinator.com/user?id=${comment.by}`;
        let HTMLtoInsert = '';

        if(comment.deleted != true && comment.dead != true)
        {
            HTMLtoInsert =
            `
            <div class="comment">
                <span onclick="toggleComment(${comment.id})" href="javascript:void(0)" id="toggle-${comment.id}" class="toggle-comment" >[ – ]</span>

                <a href=${userURL} class="comment-by"> ${comment.by} </a>

                <div id=${comment.id} class="comment-text" style="display:block"> ${comment.text} </div>
            </div>
            `
        }
        if(comment.parent == storyID){
            document.getElementById(`comments-${storyID}`).insertAdjacentHTML("beforeend", HTMLtoInsert);
        }
        else {
            document.getElementById(comment.parent).insertAdjacentHTML("beforeend", HTMLtoInsert)
        }

        if(comment.kids) { return fetchComments(comment.kids.toString(), storyID) };
    });
}



function toggleButton(str) {    
    

    pageSelection = str;
    start = 0;
    n = 15;
    result.innerHTML = "";
    fetchTopStoriesID();

    let clickedButton = document.getElementById(str);
    let allButtons = document.getElementsByClassName("page-title");

    [...allButtons].forEach(button => button.className = "page-title unselected"); 
    clickedButton.className = "page-title"; 
}



window.onscroll = function(ev) {


    if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight && printMoreStories === false) {
      printMoreStories = true;
      start += n;
      fetchTopStoriesID();
    }
  };



fetchTopStoriesID();


async function fetchLatestID() {

    latestID = await fetch(`${hackernewsURL}/${pageSelection}.json`)
    .then(response => response.json())
    .then(newStoriesID_array => newStoriesID_array[0]);

    timer = setInterval(checkForUpdate, 5000);
}

async function checkForUpdate() {

    let latestID_updated = await fetch(`${hackernewsURL}/${pageSelection}.json`)
        .then(response => response.json())
        .then(newStoriesID_array => newStoriesID_array[0]);

    if(latestID_updated != latestID)
    {
        document.querySelector(".container").style.display = '';
    }
}