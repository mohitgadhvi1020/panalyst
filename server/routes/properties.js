import express from 'express';
import supabase from '../config/supabase.js';
import { authenticate } from '../middleware/auth.js';
import { logPropertyCreated, logPropertyUpdated } from '../helpers/activityLog.js';

const router = express.Router();

router.use(authenticate);

const ALLOWED_PROPERTY_FIELDS = [
    'property_type', 'status', 'city', 'area', 'locality', 'address',
    'lat', 'lng', 'total_price', 'price_per_sqft', 'plot_area',
    'built_up_area', 'carpet_area', 'bhk', 'furnished_status',
    'floor_number', 'total_floors', 'survey_no', 'notes',
];

function pickPropertyFields(obj) {
    const result = {};
    for (const k of ALLOWED_PROPERTY_FIELDS) {
        if (k in obj && obj[k] !== '' && obj[k] !== undefined) {
            result[k] = obj[k];
        }
    }
    return result;
}

// GET /api/properties — List all for logged-in broker
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('properties')
            .select('*, property_owners(id, owner_name, phone_number, is_current_owner)')
            .eq('broker_id', req.brokerId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch properties.', details: err.message });
    }
});

// GET /api/properties/search — Pure DB search
router.get('/search', async (req, res) => {
    try {
        const { q, type, status, area, city, bhk, min_price, max_price, furnished, survey_no, owner_name } = req.query;

        let query = supabase
            .from('properties')
            .select('*, property_owners(id, owner_name, phone_number, is_current_owner)')
            .eq('broker_id', req.brokerId);

        // Exact filters
        if (type) query = query.eq('property_type', type);
        if (status) query = query.eq('status', status);
        if (bhk) query = query.eq('bhk', parseInt(bhk));
        if (furnished) query = query.eq('furnished_status', furnished);
        if (min_price) query = query.gte('total_price', parseFloat(min_price));
        if (max_price) query = query.lte('total_price', parseFloat(max_price));

        // Text filters on specific fields
        if (area) query = query.ilike('area', `%${area}%`);
        if (city) query = query.ilike('city', `%${city}%`);
        if (survey_no) query = query.ilike('survey_no', `%${survey_no}%`);

        // Quick search: broad ilike OR across all text columns
        if (q) {
            const term = q.trim();
            query = query.or(
                `city.ilike.%${term}%,` +
                `area.ilike.%${term}%,` +
                `locality.ilike.%${term}%,` +
                `address.ilike.%${term}%,` +
                `survey_no.ilike.%${term}%,` +
                `notes.ilike.%${term}%`
            );
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;

        let results = data;

        // Owner name filter — post-query since owners are a joined table
        if (owner_name) {
            const ownerTerm = owner_name.toLowerCase();
            results = results.filter(p =>
                p.property_owners?.some(o =>
                    o.owner_name?.toLowerCase().includes(ownerTerm) ||
                    o.phone_number?.includes(owner_name)
                )
            );
        }

        // If q was used and didn't match any property columns, also try matching owner names
        if (q && !owner_name) {
            const qLower = q.trim().toLowerCase();
            const dbMatches = new Set(results.map(r => r.id));
            const allWithOwners = data.filter(p =>
                !dbMatches.has(p.id) &&
                p.property_owners?.some(o =>
                    o.owner_name?.toLowerCase().includes(qLower) ||
                    o.phone_number?.includes(q.trim())
                )
            );
            // Supabase .or() already filtered; re-fetch all for owner-only matches
            if (results.length === 0) {
                const { data: allData } = await supabase
                    .from('properties')
                    .select('*, property_owners(id, owner_name, phone_number, is_current_owner)')
                    .eq('broker_id', req.brokerId)
                    .order('created_at', { ascending: false });

                if (allData) {
                    results = allData.filter(p =>
                        p.property_owners?.some(o =>
                            o.owner_name?.toLowerCase().includes(qLower) ||
                            o.phone_number?.includes(q.trim())
                        )
                    );
                }
            }
        }

        res.json(results);
    } catch (err) {
        res.status(500).json({ error: 'Search failed.', details: err.message });
    }
});

// GET /api/properties/:id/logs — Activity log for a property
router.get('/:id/logs', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('property_logs')
            .select('*')
            .eq('property_id', req.params.id)
            .eq('broker_id', req.brokerId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch logs.', details: err.message });
    }
});

// GET /api/properties/:id — Get single property
router.get('/:id', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('properties')
            .select('*, property_owners(*)')
            .eq('id', req.params.id)
            .eq('broker_id', req.brokerId)
            .single();

        if (error || !data) {
            return res.status(404).json({ error: 'Property not found.' });
        }

        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch property.', details: err.message });
    }
});

// POST /api/properties — Create property
router.post('/', async (req, res) => {
    try {
        const propertyData = {
            ...pickPropertyFields(req.body),
            broker_id: req.brokerId
        };

        const { data, error } = await supabase
            .from('properties')
            .insert(propertyData)
            .select()
            .single();

        if (error) throw error;

        logPropertyCreated(data.id, req.brokerId, data).catch(() => {});

        res.status(201).json(data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create property.', details: err.message });
    }
});

// PUT /api/properties/:id — Update property
router.put('/:id', async (req, res) => {
    try {
        const { data: existing } = await supabase
            .from('properties')
            .select('*')
            .eq('id', req.params.id)
            .eq('broker_id', req.brokerId)
            .single();

        if (!existing) {
            return res.status(404).json({ error: 'Property not found.' });
        }

        const fields = pickPropertyFields(req.body);

        const { data, error } = await supabase
            .from('properties')
            .update(fields)
            .eq('id', req.params.id)
            .eq('broker_id', req.brokerId)
            .select()
            .single();

        if (error) throw error;

        logPropertyUpdated(req.params.id, req.brokerId, existing, fields).catch(() => {});

        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update property.', details: err.message });
    }
});

// DELETE /api/properties/:id — Delete property
router.delete('/:id', async (req, res) => {
    try {
        await supabase
            .from('property_owners')
            .delete()
            .eq('property_id', req.params.id)
            .eq('broker_id', req.brokerId);

        const { error } = await supabase
            .from('properties')
            .delete()
            .eq('id', req.params.id)
            .eq('broker_id', req.brokerId);

        if (error) throw error;

        res.json({ message: 'Property deleted successfully.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete property.', details: err.message });
    }
});

export default router;
