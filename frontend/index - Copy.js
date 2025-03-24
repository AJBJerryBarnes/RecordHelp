import { FormField, Input, ViewPicker, initializeBlock,useGlobalConfig, useSettingsButton, 
	useBase, useRecords, expandRecord, Button, TextButton, ViewportConstraint,
	Box,
    Heading,
	Dialog,
    ViewPickerSynced,
    RecordCard,
    TablePickerSynced,
    FieldPickerSynced} from '@airtable/blocks/ui';
import React, { useState  } from "react"; 
import { FieldType } from '@airtable/blocks/models';

const GlobalConfigKeys = {
    PROJECT_TABLE_ID: 'projectTableId',
	PROJECT_NAME_FIELD_ID: 'projectNameFieldId',
	VOLUNTEER_TABLE_ID: 'volunteerTableId',
	VOLUNTEER_NAME_FIELD_ID: 'volunteerNameFieldId',
	VOLUNTEER_PROJECT_LINK_FIELD_ID: 'volunteerProjectLinkFieldId',
    HELP_VOLUNTEER_LINK_FIELD_ID: 'helpVolunteerLinkFieldId',
	HELP_PROJECT_LINK_FIELD_ID: 'helpProjectLinkFieldId',
	HELP_DATE_FIELD_ID: 'dateFieldId',
    HELP_TABLE_ID: 'helpTableId',
};


function Help() {
	
	const VIEWPORT_MIN_WIDTH = 345;
    const VIEWPORT_MIN_HEIGHT = 200;

    const base = useBase();

	
    const globalConfig = useGlobalConfig();
	
    // Read the user's choice for which table and views to use from globalConfig.
	// we need the project table, the help table
	// and the field on the help table which links to volunteer details plus
	// name fields from volunteers and project and the help date
	
	
	const projectTableId				= globalConfig.get(GlobalConfigKeys.PROJECT_TABLE_ID);
	const projectNameFieldId			= globalConfig.get(GlobalConfigKeys.PROJECT_NAME_FIELD_ID);
	const volunteerTableId				= globalConfig.get(GlobalConfigKeys.VOLUNTEER_TABLE_ID);
	const volunteerNameFieldId			= globalConfig.get(GlobalConfigKeys.VOLUNTEER_NAME_FIELD_ID);
	const volunteerProjectLinkFieldId	= globalConfig.get(GlobalConfigKeys.VOLUNTEER_PROJECT_LINK_FIELD_ID);
    const helpVolunteerLinkFieldId		= globalConfig.get(GlobalConfigKeys.HELP_VOLUNTEER_LINK_FIELD_ID);
	const helpProjectLinkFieldId		= globalConfig.get(GlobalConfigKeys.HELP_PROJECT_LINK_FIELD_ID);
	const dateFieldId					= globalConfig.get(GlobalConfigKeys.HELP_DATE_FIELD_ID);
    const helpTableId					= globalConfig.get(GlobalConfigKeys.HELP_TABLE_ID);



    const initialSetupDone = projectTableId && projectNameFieldId && volunteerTableId  && volunteerNameFieldId && volunteerProjectLinkFieldId &&
					helpTableId && helpVolunteerLinkFieldId && helpProjectLinkFieldId && dateFieldId ? true : false;

    // Use settings menu to hide away table pickers
    const [isShowingSettings, setIsShowingSettings] = useState(!initialSetupDone);
    useSettingsButton(function() {
        initialSetupDone && setIsShowingSettings(!isShowingSettings);
    });
	
    const projectTable		= base.getTableByIdIfExists(projectTableId);
    const volunteerTable	= base.getTableByIdIfExists(volunteerTableId);
    const helpTable			= base.getTableByIdIfExists(helpTableId);
		
	const helpVolunteerLinkField 	= helpTable ? helpTable.getFieldByIdIfExists(helpVolunteerLinkFieldId) : null;
	const helpProjectLinkField 		= helpTable ? helpTable.getFieldByIdIfExists(helpProjectLinkFieldId) : null;
	const dateField 				= helpTable ? helpTable.getFieldByIdIfExists(dateFieldId) : null;

	const volunteerNameField 			= volunteerTable ? volunteerTable.getFieldByIdIfExists(volunteerNameFieldId) : null;
	const volunteerProjectLinkField 	= volunteerTable ? volunteerTable.getFieldByIdIfExists(volunteerProjectLinkFieldId) : null;

	const projectNameField 		= projectTable   ? projectTable.getFieldByIdIfExists(projectNameFieldId) : null;
	
	const [projectName, setProjectName]			= useState("");
	const [projectRecId, setProjectRecId]		= useState("");
	const [volunteerName, setVolunteerName] 	= useState("");
	const [volunteerRecId, setVolunteerRecId]	= useState("");
	const [helpRecId, setHelpRecId]				= useState("");
	const [isDialogOpen, setIsDialogOpen]	= useState(false);
	//const memberQuery = memberTable.selectRecords();
    //const memberRecordset = useRecords(memberQuery);
	

	const volunteerRecordset = useRecords(volunteerTable ? volunteerTable.selectRecords({sorts: [
        // sort by 'My field' in ascending order...
        {field: "fName"}
     ]}) : null);

    // the filter will select only those records for which the volunteer has a link to the project 
	const volunteerRecords = volunteerRecordset ? volunteerRecordset.filter(volunteer => {
			return (volunteer.getCellValue("Project") && volunteer.getCellValue("Project")[0].id == projectRecId)
		}) : null;
	
	

	const projectRecordset = useRecords(projectTable ? projectTable.selectRecords() : null);

    // the filter will give a case insensitive search provided at least 1 chr is entered
	const projectRecords = projectRecordset ? projectRecordset.filter(project => {
			return (projectName.length > 0 && project.getCellValue(projectNameField).toUpperCase().startsWith(projectName.toUpperCase()))
		}) : null;

	if (isShowingSettings) {
        return (
            <ViewportConstraint minSize={{width: VIEWPORT_MIN_WIDTH, height: VIEWPORT_MIN_HEIGHT}}>
                <SettingsMenu
                    globalConfig={globalConfig}
                    base={base}
                    projectTable={projectTable}
                    volunteerTable={volunteerTable}
                    helpTable={helpTable}
					helpVolunteerLinkField={helpVolunteerLinkField}
					helpProjectLinkField={helpProjectLinkField}
					dateField={dateField}	
					volunteerNameField={volunteerNameField}
					volunteerProjectLinkField={volunteerProjectLinkField}
					projectNameField={projectNameField}
					initialSetupDone={initialSetupDone}
                    onDoneClick={() => setIsShowingSettings(false)}
                />
            </ViewportConstraint>
        )
    } else if (helpRecId != "") {
		if (!isDialogOpen) setIsDialogOpen(true);
		return (
		
			<div>
				Recorded {volunteerName} 
				<br></br>
				<Button onClick={() => confirmHelpAdded(setIsDialogOpen, setHelpRecId)}>Close</Button>
			</div>

		  );			
		
	} else
		return (
			
			<div>
				<FormField label="Project name">
					<Input value={projectName} onChange={e => projectNameChange(setProjectName, setProjectRecId, e.target.value)} />
				</FormField>			
				
				{projectRecords.map(record => (
					<li key={record.id}>
						<TextButton
							variant="dark"
							size="xlarge"
							onClick={() => {setProjectRecId(record.id);}}
							
						>
						{record.getCellValue(projectNameField)}
						</TextButton> 
						
					</li>
				))}
			<br></br>

				{volunteerRecords.map(record => (
					<li key={record.id}>
						<TextButton
							variant="dark"
							size="xlarge"
							onClick={() => {createHelp(helpTable, dateField, helpVolunteerLinkField, record.id, helpProjectLinkField, projectRecId,
												setProjectName, setProjectRecId, setHelpRecId, volunteerRecords, volunteerNameField, setVolunteerName);}}
							
						>
						{record.getCellValue(volunteerNameField)}
						</TextButton> 
						
					</li>
				))}
				
			</div>	
				
		);
		
}

function projectNameChange(settera, setterb, setterval){
	settera(setterval);
	setterb("");
}

function confirmHelpAdded(settera, setterb){
	settera(false);
	setterb(0);
}

async function createHelp(tHelp, dateField, hvLinkField, volunteerRecordId, hpLinkField, projectRecId, setProjectName, setProjectRecId,
                                     setHelpRecId, volunteerRecords, volunteerNameField, setVolunteerName ){
	
	if (tHelp.hasPermissionToCreateRecord()) {
		var newRecordId;
		   
		//find the date to set in the record
		let now = new Date();
		let vname = "";
		
		//get the volunteer Name
		
		for (let rec of volunteerRecords){
			if (rec.id == volunteerRecordId) {
				vname = rec.getCellValue(volunteerNameField.id);
				//console.log(vname);
			}
		}

		newRecordId = await tHelp.createRecordAsync({
						[hpLinkField.id]: [{id: projectRecId}],
						[hvLinkField.id]: [{id: volunteerRecordId}],
						[dateField.id]: now,
							});
		setHelpRecId(newRecordId);
		setVolunteerName(vname);
	}
}

function SettingsMenu(props) {

    const resetHelpTableRelatedKeys = () => {
        props.globalConfig.setAsync(GlobalConfigKeys.PROJECT_TABLE_ID, '');
        props.globalConfig.setAsync(GlobalConfigKeys.PROJECT_NAME_FIELD_ID, '');
        props.globalConfig.setAsync(GlobalConfigKeys.VOLUNTEER_TABLE_ID, '');
        props.globalConfig.setAsync(GlobalConfigKeys.VOLUNTEER_NAME_FIELD_ID, '');
        props.globalConfig.setAsync(GlobalConfigKeys.VOLUNTEER_PROJECT_LINK_FIELD_ID, '');
        props.globalConfig.setAsync(GlobalConfigKeys.HELP_VOLUNTEER_LINK_FIELD_ID, '');
        props.globalConfig.setAsync(GlobalConfigKeys.HELP_PROJECT_LINK_FIELD_ID, '');
        props.globalConfig.setAsync(GlobalConfigKeys.HELP_DATE_FIELD_ID, '');		
        //props.globalConfig.setAsync(GlobalConfigKeys.HELP_TABLE_ID, '');
    };

    const getLinkedProjectTable = () => {
        const linkFieldId = props.globalConfig.get(GlobalConfigKeys.HELP_PROJECT_LINK_FIELD_ID);
        const helpTableId = props.globalConfig.get(GlobalConfigKeys.HELP_TABLE_ID);
        const helpTable   = props.base.getTableByIdIfExists(helpTableId);

        const linkField = helpTable.getFieldByIdIfExists(linkFieldId);
        const projectTableId = linkField.options.linkedTableId;

        props.globalConfig.setAsync(GlobalConfigKeys.PROJECT_TABLE_ID, projectTableId);
   };

    const getLinkedVolunteerTable = () => {
        const linkFieldId = props.globalConfig.get(GlobalConfigKeys.HELP_VOLUNTEER_LINK_FIELD_ID);
        const helpTableId = props.globalConfig.get(GlobalConfigKeys.HELP_TABLE_ID);
        const helpTable   = props.base.getTableByIdIfExists(helpTableId);

        const linkField = helpTable.getFieldByIdIfExists(linkFieldId);
        const volunteerTableId = linkField.options.linkedTableId;

        props.globalConfig.setAsync(GlobalConfigKeys.VOLUNTEER_TABLE_ID, volunteerTableId);
   };

    return(
        <div>
            <Heading margin={2}>
                Help Settings
            </Heading>
            <Box marginX={2}>
                <FormField label="Which table holds the help?">
                    <TablePickerSynced
                        globalConfigKey={GlobalConfigKeys.HELP_TABLE_ID}
                        onChange={() => resetHelpTableRelatedKeys()}
                        size="large"
                        maxWidth="350px"
                    />
                </FormField>
                {props.helpTable &&
                    <div>
                        <Heading size="xsmall" variant="caps">{props.helpTable.name} Fields:</Heading>
                        <Box display="flex" flexDirection="row">
                            <FormField label="Project link:" marginRight={1}>
                                <FieldPickerSynced
                                    size="small"
                                    table={props.helpTable}
                                    globalConfigKey={GlobalConfigKeys.HELP_PROJECT_LINK_FIELD_ID}
                                    allowedTypes={[
                                        FieldType.MULTIPLE_RECORD_LINKS
                                    ]}
									onChange={() => getLinkedProjectTable()}
                                />
                            </FormField>

                            <FormField label="Volunteer link:" marginRight={1}>
                                <FieldPickerSynced
                                    size="small"
                                    table={props.helpTable}
                                    globalConfigKey={GlobalConfigKeys.HELP_VOLUNTEER_LINK_FIELD_ID}
                                    allowedTypes={[
                                        FieldType.MULTIPLE_RECORD_LINKS
                                    ]}
									onChange={() => getLinkedVolunteerTable()}
                                />
                            </FormField>
							
                            <FormField label="Date:" marginRight={1}>
                                <FieldPickerSynced
                                    size="small"
                                    table={props.helpTable}
                                    globalConfigKey={GlobalConfigKeys.HELP_DATE_FIELD_ID}
                                    allowedTypes={[
                                        FieldType.DATE_TIME,
										FieldType.DATE,
										FieldType.CREATED_TIME
                                    ]}
                                />
                            </FormField>
						</Box>
                    </div>
                }
				
				{props.projectTable &&
                    <div>
                        <Heading size="xsmall" variant="caps">{props.projectTable.name} Fields:</Heading>
                        <Box display="flex" flexDirection="row">
                            <FormField label="Project name:" marginRight={1}>
                                <FieldPickerSynced
                                    size="small"
                                    table={props.projectTable}
                                    globalConfigKey={GlobalConfigKeys.PROJECT_NAME_FIELD_ID}
                                    allowedTypes={[
                                        FieldType.SINGLE_LINE_TEXT,
										FieldType.FORMULA
                                    ]}
                                />
                            </FormField>
                        </Box>
                    </div>
                }

				{props.volunteerTable &&
                    <div>
                        <Heading size="xsmall" variant="caps">{props.volunteerTable.name} Fields:</Heading>
                        <Box display="flex" flexDirection="row">
                            <FormField label="Volunteer Name:" marginRight={1}>
                                <FieldPickerSynced
                                    size="small"
                                    table={props.volunteerTable}
                                    globalConfigKey={GlobalConfigKeys.VOLUNTEER_NAME_FIELD_ID}
                                    allowedTypes={[
                                        FieldType.SINGLE_LINE_TEXT,
										FieldType.FORMULA
                                    ]}
                                />
                            </FormField>
                            <FormField label="Project Link:" marginRight={1}>
                                <FieldPickerSynced
                                    size="small"
                                    table={props.volunteerTable}
                                    globalConfigKey={GlobalConfigKeys.VOLUNTEER_PROJECT_LINK_FIELD_ID}
                                    allowedTypes={[
                                        FieldType.MULTIPLE_RECORD_LINKS
                                    ]}
                                />
                            </FormField>
                        </Box>
                    </div>
                }

                <Box display="flex" marginBottom={2}>
					<Button
						variant="primary"
						icon="check"
						marginLeft={2}
						disabled={!props.initialSetupDone}
						onClick={props.onDoneClick}
						alignSelf="right"
					>
						Done
					</Button>
				</Box>
			</Box>
		</div>
    );
}

initializeBlock(() => <Help />);
