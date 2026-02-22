import dotenv from 'dotenv';
dotenv.config({ path: '../.env' });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function seed() {
    // Get broker
    const { data: brokers } = await supabase.from('brokers').select('id').limit(1);
    if (!brokers?.length) {
        console.error('No broker found. Register a user first.');
        process.exit(1);
    }
    const brokerId = brokers[0].id;
    console.log('Using broker:', brokerId);

    // Alter property_type constraint to include 'commercial'
    const { error: alterErr } = await supabase.rpc('exec_sql', {
        sql: `ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_property_type_check;
              ALTER TABLE properties ADD CONSTRAINT properties_property_type_check
              CHECK (property_type IN ('residential', 'commercial', 'plot', 'agriculture'));`
    });
    if (alterErr) {
        console.log('Could not alter constraint via RPC (expected if exec_sql not set up).');
        console.log('Please run this SQL in Supabase SQL Editor:');
        console.log(`  ALTER TABLE properties DROP CONSTRAINT IF EXISTS properties_property_type_check;`);
        console.log(`  ALTER TABLE properties ADD CONSTRAINT properties_property_type_check CHECK (property_type IN ('residential', 'commercial', 'plot', 'agriculture'));`);
    }

    const properties = [
        {
            property_type: 'plot',
            status: 'available',
            city: 'Rajkot',
            area: 'Kalawad Road',
            locality: 'Near Sahajanand Society',
            address: 'Plot No 45, Kalawad Road, Rajkot',
            lat: 22.264308,
            lng: 70.717853,
            total_price: 6000000,
            price_per_sqft: 3000,
            plot_area: 2000,
            survey_no: 'S-234',
            notes: 'Corner plot, main road facing, good for construction',
            _owner: { owner_name: 'Ramesh Patel', phone_number: '9876543210' },
        },
        {
            property_type: 'plot',
            status: 'available',
            city: 'Rajkot',
            area: 'University Road',
            locality: 'Near RK University',
            address: 'Plot 12, University Road, Rajkot',
            lat: 22.276855,
            lng: 70.721801,
            total_price: 4500000,
            price_per_sqft: 3000,
            plot_area: 1500,
            survey_no: 'S-567',
            notes: 'Near university, developing area, NA permission obtained',
            _owner: { owner_name: 'Jignesh Shah', phone_number: '9898765432' },
        },
        {
            property_type: 'agriculture',
            status: 'available',
            city: 'Rajkot',
            area: 'Gondal Road',
            address: 'Survey No 789, Gondal Road, Rajkot',
            lat: 22.267897,
            lng: 70.740907,
            total_price: 12000000,
            plot_area: 10000,
            survey_no: 'AG-789',
            notes: 'Agriculture land, bore well available, canal nearby',
            _owner: { owner_name: 'Bharat Virani', phone_number: '9825012345' },
        },
        {
            property_type: 'agriculture',
            status: 'sold',
            city: 'Rajkot',
            area: 'Gondal Road',
            locality: 'Near Highway',
            address: 'Survey No 456, Gondal Road, Rajkot',
            lat: 22.261826,
            lng: 70.739878,
            total_price: 8000000,
            plot_area: 8000,
            survey_no: 'AG-456',
            notes: 'Sold to builder for residential project',
            _owner: { owner_name: 'Suresh Mehta', phone_number: '9879012345' },
        },
        {
            property_type: 'residential',
            status: 'available',
            city: 'Rajkot',
            area: 'Gondal Road',
            locality: 'Shree Ram Society',
            address: 'Shree Ram Society, Gondal Road, Rajkot',
            lat: 22.261826,
            lng: 70.739878,
            total_price: 7500000,
            built_up_area: 1800,
            carpet_area: 1500,
            bhk: 3,
            furnished_status: 'semi-furnished',
            floor_number: 2,
            total_floors: 4,
            notes: 'Independent tenament, 3BHK, parking available, garden',
            _owner: { owner_name: 'Dinesh Joshi', phone_number: '9856789012' },
        },
        {
            property_type: 'residential',
            status: 'rented',
            city: 'Rajkot',
            area: 'Gondal Road',
            locality: 'Krishna Residency',
            address: 'Flat 502, Krishna Residency, Gondal Road, Rajkot',
            lat: 22.261826,
            lng: 70.739878,
            total_price: 5500000,
            built_up_area: 1200,
            carpet_area: 950,
            bhk: 2,
            furnished_status: 'furnished',
            floor_number: 5,
            total_floors: 9,
            notes: '2BHK fully furnished flat, currently rented at 15k/month, lift, gym',
            _owner: { owner_name: 'Nisha Sharma', phone_number: '9812345678' },
        },
        {
            property_type: 'residential',
            status: 'available',
            city: 'Rajkot',
            area: 'Gondal Road',
            locality: 'Shanti Heights',
            address: 'Flat 401, Shanti Heights, Gondal Road, Rajkot',
            lat: 22.261826,
            lng: 70.739878,
            total_price: 11000000,
            built_up_area: 2500,
            carpet_area: 2100,
            bhk: 4,
            furnished_status: 'unfurnished',
            floor_number: 4,
            total_floors: 7,
            notes: '4BHK spacious flat, sea-facing balcony, premium society, 2 parking',
            _owner: { owner_name: 'Vijay Kothari', phone_number: '9867890123' },
        },
        {
            property_type: 'commercial',
            status: 'available',
            city: 'Rajkot',
            area: 'Nana Mava Road',
            locality: 'Jai Bhimnagar',
            address: 'Shop No 7, Nana Mava Main Road, Rajkot',
            lat: 22.269706,
            lng: 70.760536,
            total_price: 3500000,
            built_up_area: 400,
            carpet_area: 350,
            notes: 'Ground floor shop on main road, high footfall, good for retail',
            _owner: { owner_name: 'Mahesh Bhai', phone_number: '9845678901' },
        },
        {
            property_type: 'commercial',
            status: 'rented',
            city: 'Rajkot',
            area: '150 Feet Ring Road',
            locality: 'Twinstar Business Hub',
            address: 'Office 1105, Twinstar Building, 150 Feet Ring Road, Rajkot',
            lat: 22.272770,
            lng: 70.780088,
            total_price: 8500000,
            built_up_area: 800,
            carpet_area: 700,
            floor_number: 11,
            total_floors: 14,
            notes: 'Commercial office on 11th floor, rented to IT company at 45k/month, fully furnished',
            _owner: { owner_name: 'Prashant Dave', phone_number: '9823456789' },
        },
        {
            property_type: 'residential',
            status: 'available',
            city: 'Rajkot',
            area: '150 Feet Ring Road',
            locality: 'RK Prime',
            address: 'Flat 1302, RK Prime, 150 Feet Ring Road, Rajkot',
            lat: 22.275567,
            lng: 70.778880,
            total_price: 9500000,
            built_up_area: 1950,
            carpet_area: 1600,
            bhk: 3,
            furnished_status: 'semi-furnished',
            floor_number: 13,
            total_floors: 15,
            notes: '3BHK in premium tower, 13th floor city view, modular kitchen, 2 balconies',
            _owner: { owner_name: 'Amit Trivedi', phone_number: '9834567890' },
        },
        {
            property_type: 'commercial',
            status: 'available',
            city: 'Rajkot',
            area: '150 Feet Ring Road',
            locality: 'Near Madhapar Chowk',
            address: 'Showroom G-3, 150 Feet Ring Road, Rajkot',
            lat: 22.274047,
            lng: 70.775256,
            total_price: 15000000,
            built_up_area: 2000,
            carpet_area: 1800,
            notes: 'Large showroom on main 150ft road, double height, 40ft frontage, ideal for automobile/furniture',
            _owner: { owner_name: 'Kamlesh Sanghvi', phone_number: '9890123456' },
        },
    ];

    let created = 0;
    for (const prop of properties) {
        const ownerData = prop._owner;
        delete prop._owner;

        const { data, error } = await supabase
            .from('properties')
            .insert({ ...prop, broker_id: brokerId })
            .select()
            .single();

        if (error) {
            console.error(`Failed to insert "${prop.notes?.slice(0, 40)}":`, error.message);
            continue;
        }

        // Add owner
        if (ownerData) {
            const { error: ownerErr } = await supabase
                .from('property_owners')
                .insert({
                    property_id: data.id,
                    broker_id: brokerId,
                    ...ownerData,
                    is_current_owner: true,
                });
            if (ownerErr) {
                console.error(`  Owner insert failed:`, ownerErr.message);
            }
        }

        // Add creation log
        await supabase.from('property_logs').insert({
            property_id: data.id,
            broker_id: brokerId,
            action: 'created',
            description: `Property created: ${prop.property_type} in ${prop.area || prop.city}`,
        });

        created++;
        console.log(`✓ ${prop.property_type.padEnd(12)} | ${(prop.area || '').padEnd(20)} | ₹${(prop.total_price / 100000).toFixed(0)}L | ${prop.status}`);
    }

    console.log(`\nDone! Created ${created}/${properties.length} properties.`);
}

seed().catch(console.error);
