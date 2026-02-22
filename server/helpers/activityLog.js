import supabase from '../config/supabase.js';

const FIELD_LABELS = {
  status: 'Status',
  property_type: 'Property Type',
  total_price: 'Total Price',
  price_per_sqft: 'Price/sq.ft',
  city: 'City',
  area: 'Area',
  locality: 'Locality',
  address: 'Address',
  bhk: 'BHK',
  furnished_status: 'Furnished Status',
  floor_number: 'Floor',
  total_floors: 'Total Floors',
  plot_area: 'Plot Area',
  built_up_area: 'Built-up Area',
  carpet_area: 'Carpet Area',
  survey_no: 'Survey No',
  lat: 'Latitude',
  lng: 'Longitude',
  notes: 'Notes',
};

function formatValue(field, val) {
  if (val == null || val === '') return '—';
  if (field === 'total_price' || field === 'price_per_sqft') {
    const n = Number(val);
    if (n >= 10000000) return `₹${(n / 10000000).toFixed(2)} Cr`;
    if (n >= 100000) return `₹${(n / 100000).toFixed(2)} L`;
    return `₹${n.toLocaleString('en-IN')}`;
  }
  return String(val);
}

export async function logPropertyCreated(propertyId, brokerId, data) {
  const location = [data.locality, data.area, data.city].filter(Boolean).join(', ');
  await supabase.from('property_logs').insert({
    property_id: propertyId,
    broker_id: brokerId,
    action: 'created',
    description: `Property created — ${data.property_type}${location ? ` in ${location}` : ''}`,
  });
}

export async function logPropertyUpdated(propertyId, brokerId, oldData, newData) {
  const logs = [];
  const tracked = Object.keys(FIELD_LABELS);

  for (const field of tracked) {
    const oldVal = oldData[field];
    const newVal = newData[field];
    if (newVal !== undefined && String(oldVal ?? '') !== String(newVal ?? '')) {
      const label = FIELD_LABELS[field];
      logs.push({
        property_id: propertyId,
        broker_id: brokerId,
        action: 'updated',
        field_name: field,
        old_value: oldVal != null ? String(oldVal) : null,
        new_value: newVal != null ? String(newVal) : null,
        description: `${label} changed from "${formatValue(field, oldVal)}" to "${formatValue(field, newVal)}"`,
      });
    }
  }

  if (logs.length > 0) {
    await supabase.from('property_logs').insert(logs);
  }
}

export async function logOwnerAdded(propertyId, brokerId, ownerName) {
  await supabase.from('property_logs').insert({
    property_id: propertyId,
    broker_id: brokerId,
    action: 'owner_added',
    description: `New owner added — ${ownerName}`,
  });
}

export async function logOwnerUpdated(propertyId, brokerId, oldOwner, newData) {
  const changes = [];
  if (newData.owner_name && newData.owner_name !== oldOwner.owner_name) {
    changes.push(`name changed from "${oldOwner.owner_name}" to "${newData.owner_name}"`);
  }
  if (newData.phone_number !== undefined && newData.phone_number !== oldOwner.phone_number) {
    changes.push(`phone changed from "${oldOwner.phone_number || '—'}" to "${newData.phone_number || '—'}"`);
  }
  if (newData.is_current_owner !== undefined && newData.is_current_owner !== oldOwner.is_current_owner) {
    changes.push(newData.is_current_owner ? `marked as current owner` : `removed as current owner`);
  }

  if (changes.length > 0) {
    await supabase.from('property_logs').insert({
      property_id: propertyId,
      broker_id: brokerId,
      action: 'owner_updated',
      description: `Owner "${oldOwner.owner_name}" — ${changes.join(', ')}`,
    });
  }
}

export async function logOwnerRemoved(propertyId, brokerId, ownerName) {
  await supabase.from('property_logs').insert({
    property_id: propertyId,
    broker_id: brokerId,
    action: 'owner_removed',
    description: `Owner removed — ${ownerName}`,
  });
}
