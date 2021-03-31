function loadCurrentCity() {
    navigator.geolocation.getCurrentPosition(
        position => {
            console.log(position)
            loadWeatherDataByPos(position, onCurrentCityLoaded, errorDuringLoadingCurrent)
        },
        error => {
            console.log(error)
            loadWeatherDataByName("Moscow", onCurrentCityLoaded, errorDuringLoadingCurrent)
        }, {timeout: 5000}
    )
}

function errorDuringLoadingCurrent() {
    alert("Can't load city")
}

function onCurrentCityLoaded(weather) {
    console.log(weather)
    let curCel = document.getElementsByClassName("current__cel")[0]
    let curCity = document.getElementsByClassName("current__city")[0]
    let curImg = document.getElementsByClassName("current__img")[0]
    let curWind = document.getElementById("cur_wind")
    let curCloudiness = document.getElementById("cur_cloudiness")
    let curPressure = document.getElementById("cur_pressure")
    let curHumidity = document.getElementById("cur_humidity")
    let curCoordinates = document.getElementById("cur_coordinates")

    curCel.textContent = `${Math.round((weather.main.temp - 273.15) * 100) / 100}°C`
    curCity.textContent = weather.name
    curImg.src = `http://openweathermap.org/img/wn/${weather.weather[0].icon}@4x.png`
    curWind.textContent = `${weather.wind.speed} m/s, ${windDegToText(weather.wind.deg)}`
    curCloudiness.textContent = `${weather.clouds.all}%`
    curPressure.textContent = `${weather.main.pressure} hpa`
    curHumidity.textContent = `${weather.main.humidity}%`
    curCoordinates.textContent = `[${weather.coord.lat}, ${weather.coord.lon}]`
}

function addNewCityByName(name) {
    addNewCity((callback, errorCallback) => {
        loadWeatherDataByName(name, callback, errorCallback)
    })
}

function addNewCity(loadFunc) {
    let favoritesList = document.getElementsByClassName("weather__favorites")[0]
    let element = createFavoriteCityElement(favoritesList)
    loadFunc(weather => {
        onCityLoaded(favoritesList, element, weather)
    }, error => {
        errorDuringLoadingFavorite(favoritesList, element, error)
    })
}

function onCityLoaded(parent, element, weather) {
    console.log(weather)
    fillCityElement(parent, element, weather)
}

function createFavoriteCityElement(parent) {
    let template = document.getElementById("favorites-template")
    let newFav = template.content.cloneNode(true)
    let element = newFav.childNodes[1]
    parent.appendChild(element)

    return element
}

function errorDuringLoadingFavorite(parent, element, error) {
    console.log(parent, element)
    parent.removeChild(element)
    alert(error)
}

function fillCityElement(parent, element, weather) {
    element.querySelector('.favorites-list__city').textContent = weather.name
    element.querySelector('.favorites-list__img').src = `http://openweathermap.org/img/wn/${weather.weather[0].icon}.png`
    element.querySelector('.favorites-list__temp').textContent = `${Math.round((weather.main.temp - 273.15) * 100) / 100}°C`
    element.querySelector('.favorites-list__button').addEventListener("click", () => {
        removeFromFavorites(weather.name, parent, element)
    })
    element.querySelector('#favorites-wind').textContent = `${weather.wind.speed} m/s, ${windDegToText(weather.wind.deg)}`
    element.querySelector('#favorites-cloudiness').textContent = `${weather.clouds.all}%`
    element.querySelector('#favorites-pressure').textContent = `${weather.main.pressure} hpa`
    element.querySelector('#favorites-humidity').textContent = `${weather.main.humidity}%`
    element.querySelector('#favorites-coordinates').textContent = `[${weather.coord.lat}, ${weather.coord.lon}]`
}

function windDegToText(degree) {
    if (degree > 337.5) return 'Northerly'
    if (degree > 292.5) return 'North Westerly'
    if (degree > 247.5) return 'Westerly'
    if (degree > 202.5) return 'South Westerly'
    if (degree > 157.5) return 'Southerly'
    if (degree > 122.5) return 'South Easterly'
    if (degree > 67.5) return 'Easterly'
    if (degree > 22.5) return 'North Easterly'
    return 'Northerly'
}

function addToFavorites(name) {
    let url = `/favorites?name=${name}`
    addNewCity((callback, errorCallback) => {
        postDataByUrl(
            url,
            () => {
                loadWeatherDataByName(name, callback, errorCallback)
            },
            error => {
                errorCallback(error)
            }
        )
    })
}

function removeFromFavorites(name, parent, element) {
    let url = `/favorites?name=${name}`
    postDataByUrl(
        url,
        () => {
            if (parent.contains(element)) {
                parent.removeChild(element)
            }
        },
        error => {
            alert(error)
        },
        true
    )
}

function loadFavorites(callback, errorCallback) {
    let url = "/favorites"
    loadDataByUrl(url, callback, errorCallback)
}

function loadWeatherDataByName(name, callback, errorCallback) {
    let url = `/weather/city?name=${name}`
    loadDataByUrl(url, callback, errorCallback)
}

function loadWeatherDataByPos(position, callback, errorCallback) {
    let url = `/weather/coordinates?lat=${position.coords.latitude}&lon=${position.coords.longitude}`
    loadDataByUrl(url, callback, errorCallback)
}

function loadDataByUrl(url, callback, errorCallback) {
    fetch(url)
        .then(response => {
            if (response.status === 200) {
                response.json().then(json => {
                    callback(json)
                })
            } else {
                errorCallback()
            }
        })
        .catch((err) => {
            errorCallback()
        })
}

function postDataByUrl(url, callback, errorCallback, toDelete) {
    let method = "POST"
    if (toDelete === true) {
        method = "DELETE"
    }
    fetch(url, {
        method: method
    })
        .then(response => {
            if (response.status === 200) {
                callback()
            } else {
                response.text().then(text => {
                    errorCallback(text)
                })
            }
        })
        .catch((err) => {
            errorCallback(err)
        })
}

window.onload = function () {
    document.getElementsByClassName("favorites__form")[0].addEventListener('submit', event => {
        event.preventDefault()
    })
    document.getElementsByClassName("favorites__button")[0].addEventListener("click", () => {
        let input = document.getElementsByClassName("favorites__input")[0]
        let cityName = input.value
        let isBlank = cityName.trim() === ""
        if (isBlank) return
        input.value = ""
        addToFavorites(cityName)
    })
    document.getElementsByClassName("header__update-geo")[0].addEventListener("click", () => {
        loadCurrentCity()
    })
    loadFavorites((favorites) => {
        favorites.forEach(item => {
            addNewCityByName(item.name)
        })
    }, () => {
        alert("Can't load favorites")
    })

    loadCurrentCity()
}

window.addEventListener('offline', () => {
    document.getElementsByClassName("favorites__button")[0].disabled = true
    document.getElementsByClassName("header__update-geo")[0].disabled = true
})

window.addEventListener('online', () => {
    document.getElementsByClassName("favorites-list__button")[0].disabled = false
    document.getElementsByClassName("header__update-geo")[0].disabled = false
})
