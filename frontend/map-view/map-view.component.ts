import { Component, AfterViewInit, Input } from '@angular/core';
import * as L from 'leaflet';

@Component({
  selector: 'app-map-view',
  standalone: true, // ✅ IMPORTANT FIX
  templateUrl: './map-view.component.html',
  styleUrls: ['./map-view.component.css']
})
export class MapViewComponent implements AfterViewInit {

  @Input() location: string = '';

  map: any;

  // ✅ UNIQUE MAP ID (prevents duplicate map errors)
  mapId = 'map-' + Math.random().toString(36).substring(2, 9);

  ngAfterViewInit(): void {
    this.loadMap();
  }

async loadMap() {

  // wait for modal to render
  setTimeout(async () => {

    if (this.map) {
      this.map.remove();
    }

    const coords = await this.getCoordinates(this.location);

    const lat = coords?.lat || 17.0005;
    const lng = coords?.lng || 81.8040;

    this.map = L.map('mapId').setView([lat, lng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

const customIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
L.marker([lat, lng], { icon: customIcon })
  .addTo(this.map)
  .bindPopup(this.location)
  .openPopup();

    // 🔥 IMPORTANT: fix rendering inside modal
    setTimeout(() => {
      this.map.invalidateSize();
    }, 200);

  }, 200);
}

  // 🔥 Geocoding
  async getCoordinates(address: string): Promise<any> {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
      );

      const data = await response.json();

      if (data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        };
      }

    } catch (error) {
      console.error("Geocoding error:", error);
    }

    return null;
  }

}