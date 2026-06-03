import { toast } from "sonner";
import { useAppShell } from "./app-context";
import { BookOpen, Camera, CircleAlert, CircleCheckBig, UserSearch, ShieldUser } from "lucide-react";
import { lazy, Suspense, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addUser, editUser, resetUserState, CreatedUser } from "@/store/slice/user-management/addUserSlice";
import { AppDispatch } from "@/store";
import { createSite, resetCreateSite } from "@/store/slice/sites-&-sops/CreateSiteSlice";
import { updateSite, resetUpdateStatus } from "@/store/slice/sites-&-sops/EditSiteSlice";
import { deleteSite, resetDeleteSite } from "@/store/slice/sites-&-sops/Deletesiteslice";
import { removeSiteById } from "@/store/slice/sites-&-sops/Allsitesslice";
import type { Site } from "@/store/slice/sites-&-sops/Allsitesslice";
import PlacesAutocomplete from "./PlacesAutocomplete";

// Lazy-load Leaflet map so it doesn't bloat the initial bundle
const DraggableMap = lazy(() => import("../app-shell/dragableMaps"));

// ─── Backdrop ────────────────────────────────────────────────────────────────

function Backdrop({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
    >
      <div onClick={(e) => e.stopPropagation()} className="modal-pop w-full max-w-lg mx-auto">
        {children}
      </div>
    </div>
  );
}

// ─── LiveMapModal ─────────────────────────────────────────────────────────────

export function LiveMapModal() {
  const { liveMapOpen, closeLiveMap } = useAppShell();
  if (!liveMapOpen) return null;
  return (
    <Backdrop onClose={closeLiveMap}>
      <div className="mx-auto max-w-5xl rounded-3xl bg-white p-8">
        <h2 className="mb-6 font-heading text-3xl font-bold text-ink">Live Site Map • All Locations</h2>
        <div className="relative flex h-96 items-center justify-center overflow-hidden rounded-3xl bg-[#0f3460] text-white">
          <div className="absolute inset-0 flex items-center justify-center text-8xl opacity-20"><BookOpen /></div>
          <div className="absolute left-12 top-12 rounded-3xl bg-white px-6 py-3 text-brand shadow-xl">Mall of Lahore (Live)</div>
          <div className="absolute right-12 top-1/3 rounded-3xl bg-white px-6 py-3 text-blue-500 shadow-xl">DHA Clinic Block (Live)</div>
          <div className="absolute bottom-12 left-1/3 rounded-3xl bg-white px-6 py-3 text-brand shadow-xl">Packages Mall (Live)</div>
          <div className="text-center text-2xl font-medium">24 Guards • 92 Patrols • 3 Incidents • Real-time</div>
        </div>
        <div className="mt-6 flex justify-end">
          <button onClick={closeLiveMap} className="rounded-3xl bg-brand px-10 py-4 text-brand-foreground">Close Map</button>
        </div>
      </div>
    </Backdrop>
  );
}

// ─── ShiftModal ───────────────────────────────────────────────────────────────

export function ShiftModal() {
  const { shiftModalOpen, closeShiftModal } = useAppShell();
  if (!shiftModalOpen) return null;
  return (
    <Backdrop onClose={closeShiftModal}>
      <div className="mx-auto max-w-lg rounded-3xl bg-white p-8">
        <h2 className="mb-6 font-heading text-2xl font-bold text-ink">Assign Shift – 16 April</h2>
        <input type="text" placeholder="Guard Name" className="mb-4 w-full rounded-3xl border border-hairline px-6 py-4 focus:border-brand focus:outline-none" />
        <select className="mb-4 w-full rounded-3xl border border-hairline px-6 py-4 focus:border-brand focus:outline-none">
          <option>Mall of Lahore</option>
          <option>DHA Clinic</option>
        </select>
        <div className="flex gap-4">
          <button onClick={closeShiftModal} className="flex-1 rounded-3xl border border-hairline py-4 text-ink">Cancel</button>
          <button
            onClick={() => { closeShiftModal(); toast.success("Shift assigned"); }}
            className="flex-1 rounded-3xl bg-brand py-4 text-brand-foreground"
          >
            Assign Shift
          </button>
        </div>
      </div>
    </Backdrop>
  );
}

// ─── UserModal ────────────────────────────────────────────────────────────────

export function UserModal() {
  const dispatch = useDispatch<AppDispatch>();
  const { loading } = useSelector((state: any) => state.user);
  const { userModalOpen, closeUserModal } = useAppShell();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    security_license_no: "",
    user_type: "",
    status: "",
  });

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.password || !form.phone || !form.user_type || !form.status) {
      toast.error("Please fill all required fields");
      return;
    }

    const res = await dispatch(addUser(form));

    if (addUser.fulfilled.match(res)) {
      toast.success("User added successfully");
      closeUserModal();
      dispatch(resetUserState());
      setForm({ name: "", email: "", password: "", phone: "", security_license_no: "", user_type: "", status: "" });
    } else {
      toast.error((res.payload as string) || "Failed to add user");
    }
  };

  if (!userModalOpen) return null;

  return (
    <Backdrop onClose={closeUserModal}>
      <div className="mx-auto max-w-lg rounded-3xl bg-white p-8">
        <h2 className="mb-6 font-heading text-2xl font-bold text-ink">Add New User</h2>

        <input type="text" placeholder="Full Name" value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="mb-4 w-full rounded-3xl border border-hairline px-6 py-4 focus:border-brand focus:outline-none" />

        <input type="email" placeholder="Email" value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="mb-4 w-full rounded-3xl border border-hairline px-6 py-4 focus:border-brand focus:outline-none" />

        <input type="password" placeholder="Password" value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="mb-4 w-full rounded-3xl border border-hairline px-6 py-4 focus:border-brand focus:outline-none" />

        <input type="text" placeholder="Phone Number" value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="mb-4 w-full rounded-3xl border border-hairline px-6 py-4 focus:border-brand focus:outline-none" />

        <input type="text" placeholder="Security License Number" value={form.security_license_no}
          onChange={(e) => setForm({ ...form, security_license_no: e.target.value })}
          className="mb-4 w-full rounded-3xl border border-hairline px-6 py-4 focus:border-brand focus:outline-none" />

        <select value={form.user_type} onChange={(e) => setForm({ ...form, user_type: e.target.value })}
          className="mb-4 w-full rounded-3xl border border-hairline px-6 py-4">
          <option value="">Select User Type</option>
          <option value="guard">Guard</option>
          <option value="manager">Manager</option>
        </select>

        <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
          className="mb-4 w-full rounded-3xl border border-hairline px-6 py-4">
          <option value="">Select Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <div className="flex gap-4">
          <button onClick={closeUserModal} className="flex-1 rounded-3xl border border-hairline py-4 text-ink">Cancel</button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 rounded-3xl bg-brand py-4 text-brand-foreground disabled:opacity-50">
            {loading ? "Creating..." : "Create User"}
          </button>
        </div>
      </div>
    </Backdrop>
  );
}

// ─── EditUserModal ────────────────────────────────────────────────────────────

export function EditUserModal({
  user,
  onClose,
}: {
  user: CreatedUser;
  onClose: () => void;
}) {
  const dispatch = useDispatch<AppDispatch>();
  const { editLoading } = useSelector((state: any) => state.user);

  const [form, setForm] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone ?? "",
    security_license_no: user.security_license_no ?? "",
    user_type: user.user_type,
    status: user.status === 1 ? "active" : "inactive",
    password: "",
  });

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.phone || !form.user_type || !form.status) {
      toast.error("Please fill all required fields");
      return;
    }

    const res = await dispatch(
      editUser({
        id: user.id,
        name: form.name,
        email: form.email,
        phone: form.phone,
        security_license_no: form.security_license_no,
        user_type: form.user_type,
        status: form.status,
        ...(form.password ? { password: form.password } : {}),
      })
    );

    if (editUser.fulfilled.match(res)) {
      toast.success("User updated successfully");
      onClose();
    } else {
      toast.error((res.payload as string) || "Failed to update user");
    }
  };

  return (
    <Backdrop onClose={onClose}>
      <div className="mx-auto max-w-lg rounded-3xl bg-white p-8">
        <h2 className="mb-6 font-heading text-2xl font-bold text-ink">Edit User</h2>

        <input type="text" placeholder="Full Name" value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="mb-4 w-full rounded-3xl border border-hairline px-6 py-4 focus:border-brand focus:outline-none" />

        <input type="email" placeholder="Email" value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="mb-4 w-full rounded-3xl border border-hairline px-6 py-4 focus:border-brand focus:outline-none" />

        <input type="password" placeholder="New Password (leave blank to keep current)" value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="mb-4 w-full rounded-3xl border border-hairline px-6 py-4 focus:border-brand focus:outline-none" />

        <input type="text" placeholder="Phone Number" value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="mb-4 w-full rounded-3xl border border-hairline px-6 py-4 focus:border-brand focus:outline-none" />

        <input type="text" placeholder="Security License Number" value={form.security_license_no}
          onChange={(e) => setForm({ ...form, security_license_no: e.target.value })}
          className="mb-4 w-full rounded-3xl border border-hairline px-6 py-4 focus:border-brand focus:outline-none" />

        <select value={form.user_type} onChange={(e) => setForm({ ...form, user_type: e.target.value })}
          className="mb-4 w-full rounded-3xl border border-hairline px-6 py-4">
          <option value="">Select User Type</option>
          <option value="guard">Guard</option>
          <option value="manager">Manager</option>
        </select>

        <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
          className="mb-4 w-full rounded-3xl border border-hairline px-6 py-4">
          <option value="">Select Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <div className="flex gap-4">
          <button onClick={onClose} className="flex-1 rounded-3xl border border-hairline py-4 text-ink">Cancel</button>
          <button onClick={handleSubmit} disabled={editLoading}
            className="flex-1 rounded-3xl bg-brand py-4 text-brand-foreground disabled:opacity-50">
            {editLoading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </Backdrop>
  );
}

// ─── Reusable file input with label ──────────────────────────────────────────

function FileField({
  label,
  onChange,
}: {
  label: string;
  onChange: (file: File | null) => void;
}) {
  return (
    <div className="mb-4">
      <label className="mb-1 block text-sm font-medium text-ink">{label}</label>
      <input
        type="file"
        accept="application/pdf,.pdf"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        className="w-full rounded-3xl border border-hairline px-4 py-3 text-sm text-ink file:mr-4 file:rounded-full file:border-0 file:bg-brand file:px-4 file:py-1 file:text-xs file:text-brand-foreground focus:border-brand focus:outline-none"
      />
    </div>
  );
}

// ─── Site form types & helpers ────────────────────────────────────────────────

interface SiteFormState {
  site_name: string;
  site_description: string;
  address: string;
  coordinates: string;
  latitude: string;
  longitude: string;
  signin_radius: number;
  state: string;
  emergency_procedures: File | null;
  patrol_checkpoints: File | null;
  incident_reporting_guide: File | null;
  nfc_scan_protocol: File | null;
}

const emptySiteForm: SiteFormState = {
  site_name: "",
  site_description: "",
  address: "",
  coordinates: "",
  latitude: "",
  longitude: "",
  signin_radius: 100,
  state: "",
  emergency_procedures: null,
  patrol_checkpoints: null,
  incident_reporting_guide: null,
  nfc_scan_protocol: null,
};

// Keeps latitude, longitude, and coordinates in sync.
// The Laravel backend parses lat/lng from the coordinates field via explode(',', $request->coordinates).
function syncCoords(
  prev: SiteFormState,
  patch: Partial<Pick<SiteFormState, "latitude" | "longitude" | "coordinates">>
): SiteFormState {
  const next = { ...prev, ...patch };
  if ("latitude" in patch || "longitude" in patch) {
    next.coordinates =
      next.latitude && next.longitude
        ? `${next.latitude},${next.longitude}`
        : next.coordinates;
  } else if ("coordinates" in patch) {
    const parts = (patch.coordinates ?? "").split(",");
    if (parts.length === 2) {
      next.latitude = parts[0].trim();
      next.longitude = parts[1].trim();
    }
  }
  return next;
}

// Calls Nominatim (free, no API key) to convert an address string into lat/lng.
async function geocodeAddress(address: string): Promise<{ lat: string; lng: string } | null> {
  try {
    const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${key}`
    );
    const data = await res.json();
    if (data.status !== "OK" || !data.results.length) return null;
    const { lat, lng } = data.results[0].geometry.location;
    return { lat: String(lat), lng: String(lng) };
  } catch {
    return null;
  }
}

// Reusable geocode + GPS buttons used in both SiteModal and EditSiteModal.
function LocationButtons({
  address,
  onCoords,
}: {
  address: string;
  onCoords: (lat: string, lng: string) => void;
}) {
  const [geoLoading, setGeoLoading] = useState(false);

  const handleGeocode = async () => {
    if (!address) { toast.error("Enter an address first"); return; }
    setGeoLoading(true);
    const result = await geocodeAddress(address);
    setGeoLoading(false);
    if (!result) { toast.error("Address not found — try being more specific"); return; }
    onCoords(result.lat, result.lng);
    toast.success("Coordinates found");
  };

  const handleGPS = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => onCoords(String(pos.coords.latitude), String(pos.coords.longitude)),
      () => toast.error("Location access denied")
    );
  };

  return (
    <div className="mb-3 flex gap-3">
      <button
        type="button"
        onClick={handleGeocode}
        disabled={geoLoading}
        className="flex-1 rounded-3xl border border-hairline px-6 py-3 text-sm text-ink hover:bg-surface-muted disabled:opacity-50"
      >
        {geoLoading ? "Looking up…" : "📍 Look up coordinates from address"}
      </button>
      <button
        type="button"
        onClick={handleGPS}
        className="rounded-3xl border border-hairline px-5 py-3 text-sm text-ink hover:bg-surface-muted"
        title="Use my current GPS location"
      >
        🎯 My location
      </button>
    </div>
  );
}

// Skeleton shown while the Leaflet map bundle is loading
function MapSkeleton() {
  return (
    <div className="mb-4 h-48 w-full animate-pulse rounded-2xl bg-surface-muted flex items-center justify-center text-sm text-ink/40">
      Loading map…
    </div>
  );
}

// ─── SiteModal ────────────────────────────────────────────────────────────────

export function SiteModal() {
  const user = useSelector((state: any) => state.auth.user);
  const dispatch = useDispatch<AppDispatch>();
  const { loading } = useSelector((state: any) => state.createSite);
  const { siteModalOpen, closeSiteModal } = useAppShell();

  const [form, setForm] = useState<SiteFormState>(emptySiteForm);

  const handleSubmit = async () => {
    if (!user?.id) { toast.error("User not logged in"); return; }
    if (!form.site_name || !form.address || !form.latitude || !form.longitude || !form.state) {
      toast.error("Please fill all required fields");
      return;
    }

    const formData = new FormData();
    formData.append("user_id", String(user.id));
    formData.append("site_name", form.site_name);
    formData.append("site_description", form.site_description);
    formData.append("address", form.address);
    formData.append("coordinates", `${form.latitude},${form.longitude}`);
    formData.append("latitude", form.latitude);
    formData.append("longitude", form.longitude);
    formData.append("signin_radius", String(form.signin_radius));
    formData.append("state", form.state);

    if (form.emergency_procedures) formData.append("emergency_procedures", form.emergency_procedures);
    if (form.patrol_checkpoints) formData.append("patrol_checkpoints", form.patrol_checkpoints);
    if (form.incident_reporting_guide) formData.append("incident_reporting_guide", form.incident_reporting_guide);
    if (form.nfc_scan_protocol) formData.append("nfc_scan_protocol", form.nfc_scan_protocol);

    const res = await dispatch(createSite(formData));

    if (createSite.fulfilled.match(res)) {
      toast.success("Site created successfully");
      dispatch(resetCreateSite());
      setForm(emptySiteForm);
      closeSiteModal();
    } else {
      toast.error((res.payload as any)?.message || "Failed to create site");
    }
  };

  if (!siteModalOpen) return null;

  return (
    <Backdrop onClose={closeSiteModal}>
      <div className="mx-auto max-w-lg rounded-3xl bg-white p-8 max-h-[90vh] overflow-y-auto">
        <h2 className="mb-6 font-heading text-2xl font-bold text-ink">Add New Site</h2>

        <input type="text" placeholder="Site Name *" value={form.site_name}
          onChange={(e) => setForm({ ...form, site_name: e.target.value })}
          className="mb-4 w-full rounded-3xl border border-hairline px-6 py-4 focus:border-brand focus:outline-none" />

        <input type="text" placeholder="Description" value={form.site_description}
          onChange={(e) => setForm({ ...form, site_description: e.target.value })}
          className="mb-4 w-full rounded-3xl border border-hairline px-6 py-4 focus:border-brand focus:outline-none" />

      <PlacesAutocomplete
  value={form.address}
  onChange={(val) => setForm({ ...form, address: val })}
  onSelect={(address, lat, lng) =>
    setForm(syncCoords({ ...form, address }, { latitude: lat, longitude: lng }))
  }
/>
       

        {/* Interactive map — drag the pin or click anywhere to set location */}
        <Suspense fallback={<MapSkeleton />}>
          <DraggableMap
            lat={Number(form.latitude) || 31.5204}
            lng={Number(form.longitude) || 74.3587}
            onChange={(lat, lng) =>
              setForm(syncCoords(form, {
                latitude: String(lat),
                longitude: String(lng),
              }))
            }
          />
        </Suspense>
         <LocationButtons
          address={form.address}
          onCoords={(lat, lng) => setForm(syncCoords(form, { latitude: lat, longitude: lng }))}
        />

        <div className="mb-4 flex gap-3">
          <input type="number" step="any" placeholder="Latitude *" value={form.latitude}
            onChange={(e) => setForm(syncCoords(form, { latitude: e.target.value }))}
            className="w-full rounded-3xl border border-hairline px-6 py-4 focus:border-brand focus:outline-none" />
          <input type="number" step="any" placeholder="Longitude *" value={form.longitude}
            onChange={(e) => setForm(syncCoords(form, { longitude: e.target.value }))}
            className="w-full rounded-3xl border border-hairline px-6 py-4 focus:border-brand focus:outline-none" />
        </div>

        <input type="number" placeholder="Signin Radius (meters)" value={form.signin_radius}
          onChange={(e) => setForm({ ...form, signin_radius: Number(e.target.value) })}
          className="mb-4 w-full rounded-3xl border border-hairline px-6 py-4 focus:border-brand focus:outline-none" />

        <select value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })}
          className="mb-6 w-full rounded-3xl border border-hairline px-6 py-4">
          <option value="">Select State *</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <FileField label="Emergency Procedures (PDF)"
          onChange={(f) => setForm((prev) => ({ ...prev, emergency_procedures: f }))} />
        <FileField label="Patrol Checkpoints (PDF)"
          onChange={(f) => setForm((prev) => ({ ...prev, patrol_checkpoints: f }))} />
        <FileField label="Incident Reporting Guide (PDF)"
          onChange={(f) => setForm((prev) => ({ ...prev, incident_reporting_guide: f }))} />
        <FileField label="NFC Scan Protocol (PDF)"
          onChange={(f) => setForm((prev) => ({ ...prev, nfc_scan_protocol: f }))} />

        <div className="flex gap-4">
          <button onClick={closeSiteModal} className="flex-1 rounded-3xl border border-hairline py-4 text-ink">Cancel</button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-1 rounded-3xl bg-brand py-4 text-brand-foreground disabled:opacity-50">
            {loading ? "Creating..." : "Create Site"}
          </button>
        </div>
      </div>
    </Backdrop>
  );
}

// ─── EditSiteModal ────────────────────────────────────────────────────────────

export function EditSiteModal({
  site,
  onClose,
}: {
  site: Site;
  onClose: () => void;
}) {
  const dispatch = useDispatch<AppDispatch>();
  const { updateLoading } = useSelector((state: any) => state.editSite);

  const [form, setForm] = useState<SiteFormState>({
    site_name: site.site_name,
    site_description: site.site_description ?? "",
    address: site.address,
    coordinates: site.coordinates ?? `${site.latitude ?? ""},${site.longitude ?? ""}`,
    latitude: String(site.latitude ?? ""),
    longitude: String(site.longitude ?? ""),
    signin_radius: site.signin_radius,
    state: site.state,
    emergency_procedures: null,
    patrol_checkpoints: null,
    incident_reporting_guide: null,
    nfc_scan_protocol: null,
  });

  const handleSubmit = async () => {
    if (!form.site_name || !form.address || !form.latitude || !form.longitude || !form.state) {
      toast.error("Please fill all required fields");
      return;
    }

    const formData = new FormData();
    formData.append("site_name", form.site_name);
    formData.append("site_description", form.site_description);
    formData.append("address", form.address);
    formData.append("coordinates", `${form.latitude},${form.longitude}`);
    formData.append("latitude", form.latitude);
    formData.append("longitude", form.longitude);
    formData.append("signin_radius", String(form.signin_radius));
    formData.append("state", form.state);

    if (form.emergency_procedures) formData.append("emergency_procedures", form.emergency_procedures);
    if (form.patrol_checkpoints) formData.append("patrol_checkpoints", form.patrol_checkpoints);
    if (form.incident_reporting_guide) formData.append("incident_reporting_guide", form.incident_reporting_guide);
    if (form.nfc_scan_protocol) formData.append("nfc_scan_protocol", form.nfc_scan_protocol);

    const res = await dispatch(updateSite({ id: site.id, siteData: formData }));

    if (updateSite.fulfilled.match(res)) {
      toast.success("Site updated successfully");
      dispatch(resetUpdateStatus());
      onClose();
    } else {
      toast.error((res.payload as any)?.message || "Failed to update site");
    }
  };

  return (
    <Backdrop onClose={onClose}>
      <div className="mx-auto max-w-lg rounded-3xl bg-white p-8 max-h-[90vh] overflow-y-auto">
        <h2 className="mb-6 font-heading text-2xl font-bold text-ink">Edit Site</h2>

        <input type="text" placeholder="Site Name *" value={form.site_name}
          onChange={(e) => setForm({ ...form, site_name: e.target.value })}
          className="mb-4 w-full rounded-3xl border border-hairline px-6 py-4 focus:border-brand focus:outline-none" />

        <input type="text" placeholder="Description" value={form.site_description}
          onChange={(e) => setForm({ ...form, site_description: e.target.value })}
          className="mb-4 w-full rounded-3xl border border-hairline px-6 py-4 focus:border-brand focus:outline-none" />

       <PlacesAutocomplete
  value={form.address}
  onChange={(val) => setForm({ ...form, address: val })}
  onSelect={(address, lat, lng) =>
    setForm(syncCoords({ ...form, address }, { latitude: lat, longitude: lng }))
  }
/>
        <LocationButtons
          address={form.address}
          onCoords={(lat, lng) => setForm(syncCoords(form, { latitude: lat, longitude: lng }))}
        />

        {/* Interactive map — pre-populated with existing site coords, drag to adjust */}
        <Suspense fallback={<MapSkeleton />}>
          <DraggableMap
            lat={Number(form.latitude) || 31.5204}
            lng={Number(form.longitude) || 74.3587}
            onChange={(lat, lng) =>
              setForm(syncCoords(form, {
                latitude: String(lat),
                longitude: String(lng),
              }))
            }
          />
        </Suspense>

        <div className="mb-4 flex gap-3">
          <input type="number" step="any" placeholder="Latitude *" value={form.latitude}
            onChange={(e) => setForm(syncCoords(form, { latitude: e.target.value }))}
            className="w-full rounded-3xl border border-hairline px-6 py-4 focus:border-brand focus:outline-none" />
          <input type="number" step="any" placeholder="Longitude *" value={form.longitude}
            onChange={(e) => setForm(syncCoords(form, { longitude: e.target.value }))}
            className="w-full rounded-3xl border border-hairline px-6 py-4 focus:border-brand focus:outline-none" />
        </div>

        <input type="number" placeholder="Signin Radius (meters)" value={form.signin_radius}
          onChange={(e) => setForm({ ...form, signin_radius: Number(e.target.value) })}
          className="mb-4 w-full rounded-3xl border border-hairline px-6 py-4 focus:border-brand focus:outline-none" />

        <select value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })}
          className="mb-6 w-full rounded-3xl border border-hairline px-6 py-4">
          <option value="">Select State *</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <FileField label="Emergency Procedures (PDF)"
          onChange={(f) => setForm((prev) => ({ ...prev, emergency_procedures: f }))} />
        <FileField label="Patrol Checkpoints (PDF)"
          onChange={(f) => setForm((prev) => ({ ...prev, patrol_checkpoints: f }))} />
        <FileField label="Incident Reporting Guide (PDF)"
          onChange={(f) => setForm((prev) => ({ ...prev, incident_reporting_guide: f }))} />
        <FileField label="NFC Scan Protocol (PDF)"
          onChange={(f) => setForm((prev) => ({ ...prev, nfc_scan_protocol: f }))} />

        <div className="flex gap-4">
          <button onClick={onClose} className="flex-1 rounded-3xl border border-hairline py-4 text-ink">Cancel</button>
          <button onClick={handleSubmit} disabled={updateLoading}
            className="flex-1 rounded-3xl bg-brand py-4 text-brand-foreground disabled:opacity-50">
            {updateLoading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </Backdrop>
  );
}

// ─── useDeleteSite ────────────────────────────────────────────────────────────

export function useDeleteSite() {
  const dispatch = useDispatch<AppDispatch>();
  const { loading } = useSelector((state: any) => state.deleteSite);

  const handleDelete = async (id: number, siteName: string) => {
    const confirmed = window.confirm(`Delete "${siteName}"? This cannot be undone.`);
    if (!confirmed) return;

    const res = await dispatch(deleteSite(id));

    if (deleteSite.fulfilled.match(res)) {
      dispatch(removeSiteById(id));
      dispatch(resetDeleteSite());
      toast.success(`"${siteName}" deleted`);
    } else {
      toast.error("Failed to delete site");
    }
  };

  return { handleDelete, deleteLoading: loading };
}

// ─── NotificationPanel ────────────────────────────────────────────────────────

export function NotificationPanel() {
  const { notificationsOpen, closeNotifications } = useAppShell();
  if (!notificationsOpen) return null;

  const notifications = [
    { icon: <CircleAlert className="h-4 w-4 text-red-500" />, text: "New incident at Mall of Lahore" },
    { icon: <CircleCheckBig className="h-4 w-4 text-emerald-500" />, text: "Ahmed Khan completed patrol" },
    { icon: <Camera className="h-4 w-4 text-blue-500" />, text: "4 new photos uploaded" },
    { icon: <UserSearch className="h-4 w-4 text-brand" />, text: "NFC scan logged at Gate A" },
    { icon: <ShieldUser className="h-4 w-4 text-purple-500" />, text: "New shift starting in 30 min" },
  ];

  return (
    <>
      <div className="fixed inset-0 z-[9998]" onClick={closeNotifications} />
      <div className="fixed right-8 top-20 z-[9999] w-96 overflow-hidden rounded-3xl border border-hairline bg-white shadow-2xl">
        <div className="border-b border-hairline px-6 py-5 font-semibold text-ink">
          Notifications ({notifications.length})
        </div>
        <div className="max-h-96 overflow-auto p-2">
          {notifications.map((n, i) => (
            <div key={i} className="flex items-center gap-3 rounded-3xl p-4 text-sm text-ink hover:bg-surface-muted">
              {n.icon}
              {n.text}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}