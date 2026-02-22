import express from 'express';
import supabase from '../config/supabase.js';
import { authenticate } from '../middleware/auth.js';
import { logOwnerAdded, logOwnerUpdated, logOwnerRemoved } from '../helpers/activityLog.js';

const router = express.Router();

router.use(authenticate);

function cleanData(obj) {
    const cleaned = {};
    for (const [k, v] of Object.entries(obj)) {
        if (v === '' || v === undefined) continue;
        cleaned[k] = v;
    }
    return cleaned;
}

const ALLOWED_OWNER_FIELDS = [
    'owner_name', 'phone_number', 'start_date', 'end_date',
    'is_current_owner', 'notes',
];

function pickOwnerFields(obj) {
    const result = {};
    for (const k of ALLOWED_OWNER_FIELDS) {
        if (k in obj && obj[k] !== '' && obj[k] !== undefined) {
            result[k] = obj[k];
        }
    }
    return result;
}

// GET /api/properties/:propertyId/owners — Get ownership history
router.get('/:propertyId/owners', async (req, res) => {
    try {
        const { data: property } = await supabase
            .from('properties')
            .select('id')
            .eq('id', req.params.propertyId)
            .eq('broker_id', req.brokerId)
            .single();

        if (!property) {
            return res.status(404).json({ error: 'Property not found.' });
        }

        const { data, error } = await supabase
            .from('property_owners')
            .select('*')
            .eq('property_id', req.params.propertyId)
            .eq('broker_id', req.brokerId)
            .order('start_date', { ascending: false });

        if (error) throw error;

        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch owners.', details: err.message });
    }
});

// POST /api/properties/:propertyId/owners — Add new owner
router.post('/:propertyId/owners', async (req, res) => {
    try {
        const { data: property } = await supabase
            .from('properties')
            .select('id')
            .eq('id', req.params.propertyId)
            .eq('broker_id', req.brokerId)
            .single();

        if (!property) {
            return res.status(404).json({ error: 'Property not found.' });
        }

        const fields = pickOwnerFields(req.body);

        if (fields.is_current_owner) {
            await supabase
                .from('property_owners')
                .update({
                    is_current_owner: false,
                    end_date: new Date().toISOString().split('T')[0]
                })
                .eq('property_id', req.params.propertyId)
                .eq('broker_id', req.brokerId)
                .eq('is_current_owner', true);
        }

        const ownerData = {
            ...fields,
            property_id: req.params.propertyId,
            broker_id: req.brokerId
        };

        const { data, error } = await supabase
            .from('property_owners')
            .insert(ownerData)
            .select()
            .single();

        if (error) throw error;

        logOwnerAdded(req.params.propertyId, req.brokerId, data.owner_name).catch(() => {});

        res.status(201).json(data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to add owner.', details: err.message });
    }
});

// PUT /api/owners/:id — Update owner
router.put('/owners/:id', async (req, res) => {
    try {
        const { data: existing } = await supabase
            .from('property_owners')
            .select('*')
            .eq('id', req.params.id)
            .eq('broker_id', req.brokerId)
            .single();

        if (!existing) {
            return res.status(404).json({ error: 'Owner not found.' });
        }

        const fields = pickOwnerFields(req.body);

        if (fields.is_current_owner) {
            await supabase
                .from('property_owners')
                .update({
                    is_current_owner: false,
                    end_date: new Date().toISOString().split('T')[0]
                })
                .eq('property_id', existing.property_id)
                .eq('broker_id', req.brokerId)
                .eq('is_current_owner', true);
        }

        const { data, error } = await supabase
            .from('property_owners')
            .update(fields)
            .eq('id', req.params.id)
            .eq('broker_id', req.brokerId)
            .select()
            .single();

        if (error) throw error;

        logOwnerUpdated(existing.property_id, req.brokerId, existing, req.body).catch(() => {});

        res.json(data);
    } catch (err) {
        res.status(500).json({ error: 'Failed to update owner.', details: err.message });
    }
});

// DELETE /api/owners/:id — Delete owner
router.delete('/owners/:id', async (req, res) => {
    try {
        const { data: existing } = await supabase
            .from('property_owners')
            .select('property_id, owner_name')
            .eq('id', req.params.id)
            .eq('broker_id', req.brokerId)
            .single();

        const { error } = await supabase
            .from('property_owners')
            .delete()
            .eq('id', req.params.id)
            .eq('broker_id', req.brokerId);

        if (error) throw error;

        if (existing) {
            logOwnerRemoved(existing.property_id, req.brokerId, existing.owner_name).catch(() => {});
        }

        res.json({ message: 'Owner deleted successfully.' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete owner.', details: err.message });
    }
});

export default router;
