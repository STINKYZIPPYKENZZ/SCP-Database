example: INSERT INTO SCP_data (
    id,
    item,
    class
)
VALUES (
    2,
    'SCP-002',
    'Euclid'
);
 
INSERT INTO SCP_description (
    id,
    scp_id,
    description
)
VALUES (
    2,
    2,
    'SCP-002 is a fleshy, tumorous growth resembling a furnished apartment room.'
);

INSERT INTO SCP_containment (
    id,
    scp_id,
    containment
)
VALUES (
    2,
    2,
    'SCP-002 is to be contained in a standard humanoid containment cell with a minimum of two guards on duty at all times.'
);