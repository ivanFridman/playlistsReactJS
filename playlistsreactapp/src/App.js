import React, { Component } from 'react';
import './App.css';
import querystring from 'query-string';

let defaultTextColor = "#fff";
let defaultStyle = {
   color: defaultTextColor,
   'font-family': 'Papyrus'
}

let userName = "Ivan"

let fakeServerData ={
  user: {
    name: "Ivan",
    Age: "32",
    Sex: "Male",
    playlists: [
      {
        name:"Rock Argentino",
        songs: [
          {name:"La ciudad de la furia", duration:360}, 
          {name:"Seminare", duration:320},
          {name:"Tan solo", duration:400}]
      },
      {
        name:"Rock Britanico",
        songs: [
          {name:"Dont Look back in Anger", duration:420},
           {name:"Yellow Submarine", duration:280},
           {name:"Start me up", duration:370}]
      },
      {
        name:"Cachengue",
        songs: [
          {name:"La ventanita", duration:280},
           {name:"Lo mejor del amor", duration:310},
           {name:"Amor del chat", duration:250}]

      },
      {
        name:"Lentos",
        songs: [
          {name:"Track 1", duration:340},
           {name:"Track 2", duration:240},
           {name:"Track 3", duration:660}]

      }
    ]
  }

}

class PlayListsCounter extends Component {
  render () {
    return (

    <div style={{...defaultStyle, width: "40%", display:'inline-block'}}>
      <h2 style={{color: defaultTextColor}}>
        { this.props.playlists &&
          this.props.playlists.length} Listas
      </h2>
    </div>

    );
  }
}

class HoursCounter extends Component {
  render () {

    let allSongs = this.props.playlists.reduce((songs, eachPlaylist) =>{
      return songs.concat( eachPlaylist.songs)
    }  , [])

    let totalDuration = allSongs.reduce((sum,eachSong) => {
      return sum + eachSong.duration;
    },0)

    return (

    <div style={{...defaultStyle, width: "40%", display:'inline-block'}}>
      <h2 style={{color: defaultTextColor}}>
        {Math.round(totalDuration/60)} Horas
      </h2>
    </div>

    );
  }
}

class Filter extends Component{

  render(){

    return(
      <div style={defaultStyle}> 
         <img></img>
         <input type="text" onKeyUp={event => this.props.onTextChange(event.target.value)}/>
         Filter
      </div>
    );

  }

}

class PlayList extends Component{

  render(){

    return <div style={{...defaultStyle, width:"25%", display:'inline-block'}}>
              <img src={this.props.playlist.imageUrl} style={{width:'120px'}}></img>
              <h3>{this.props.playlist.name}</h3>
              <ul>
                {
                  this.props.playlist.songs.map(song => 
                    <li>
                      {song.name}
                    </li>)
                }
              </ul>
            </div>

  }

}


class App extends Component {

  constructor(){
    super();
    this.state = {
      serverData:{},
      filterString:''
    }
  }

  componentDidMount(){
    let parsed = querystring.parse(window.location.search);
    let accessToken = parsed.access_token;

   // console.log(accessToken);

    if(!accessToken)
      return;

    fetch('https://api.spotify.com/v1/me',{
      headers:{
          'Authorization':'Bearer ' + accessToken
      }
    }).then(response => response.json()).
        then(data => this.setState(
            {
              user:{name: data.id}
            }))

    fetch('https://api.spotify.com/v1/me/playlists',{
      headers:{
          'Authorization':'Bearer ' + accessToken
      }
     }).then(response => response.json()).
     then(playListData => {
        let playLists = playListData.items
        let trackDataPromises = playLists.map(playlist => {
          let responsePromise = fetch(playlist.tracks.href,{
            headers:{
              'Authorization':'Bearer ' + accessToken
            }
          })
        
        let trackDataPromise = responsePromise
          .then(response => response.json())
        return trackDataPromise
        })

        let allTracksDataPromises = Promise.all(trackDataPromises)
        let playListsPromise = allTracksDataPromises.then(trackDatas => {
          trackDatas.forEach((trackData,i) =>{
            playLists[i].trackDatas = trackData.items
            .map(item => item.track)
            .map(trackData => ({
              name: trackData.name,
              duration: trackData.duration_ms/1000
            }))
          })
          return playLists
        })
        return playListsPromise
     })
        .then(playlists => this.setState(
            {
               playlists: playlists.map(item => {
                  console.log(item.trackDatas)
                  return{
                    name: item.name,
                    imageUrl: item.images[0].url,
                    songs: item.trackDatas.slice(0,3)
                  }
                })        
            }))
              
              
              

  }
    render() {
    
      let playlistToRender = 
          this.state.user &&
          this.state.playlists ?
          this.state.playlists.filter(playlist => 
              playlist.name.toLowerCase().includes
              (this.state.filterString.toLowerCase())): []


    return (
      <div className="App">
        {this.state.user  ?
          
          <div>
            
            <h1>Playlists de &nbsp;          
                {this.state.user.name}
            </h1>

            <PlayListsCounter playlists={playlistToRender}/>
            <HoursCounter playlists={playlistToRender}/>
            <Filter onTextChange={text => this.setState({filterString: text})}/>
          
          {
            playlistToRender.map(
                playlist => <PlayList playlist={playlist}/>
             )     
          }
        
        </div> : <button
                    onClick={() => 
                      window.location.includes('localhost') ?
                      window.location='http://localhost:8888/login' :
                      window.location=''
                    }
                    style={{padding:'20px', 'font-size':'30px','margin-top':'20px' }}>Iniciar Sesion con Spotify</button>
        } 

      </div>
    );
  }
}

export default App;
