# Maps with TSP

[https://mesmatyi.github.io/maps-with-tsp/](https://mesmatyi.github.io/maps-with-tsp/)

![Demo view](/img/scr.png)

Small webpage designed to run a client side TSP and with that optimize for best route possible between multiple waypoints

## Main features

- Pick waypoints or segmetns on map
- Able to genrate a close to optimal route between multiple waypoints or segments
- Visualize the final route on map and export to a downloadable GPX format


## TSP Solver

The client side TSP solver is implemented in the *TSP.js* file contains the following 3 different TSP algorithms:

* Nearest_Addition
* Nearest_Insertion
* Farthest_Insertion

From the 3 output the core unction returns the one with the lowest overall length.

## Mapbox API

From the Mapbox sweet we use the [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js/guides/) for Map visualization and also for dropping Markers. For route planning we use the [Mapbox Directions API](https://docs.mapbox.com/api/navigation/directions/)

The third API we use from Mapbox is the [Matrix API](https://docs.mapbox.com/api/navigation/matrix/), the return of this API call delivers the input for the client side TSP solver. By using this API we can use the solver with the real world distances between Markers instead of the bee - line.
