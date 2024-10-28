import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Avatar,
  Card,
  Divider,
  Stack,
  Typography,
  AccordionGroup,
  accordionSummaryClasses,
  accordionDetailsClasses,
} from '@mui/joy';
import { FungibleToken } from '../../ecs/components';
import StakedToken from './StakedToken';
import UnstakedToken from './UnstakedToken';
import { fromBaseUnit } from '../../utils/tokens';

export default function TokenList({ tokens }: { tokens: FungibleToken[] }) {
  return (
    <AccordionGroup
      variant="outlined"
      transition="0.2s"
      sx={(theme) => ({
        borderRadius: 'lg',
        [`& .${accordionSummaryClasses.button}:hover`]: {
          bgcolor: 'transparent !important',
        },
        [`& .${accordionDetailsClasses.content}`]: {
          boxShadow: `inset 0 1px ${theme.vars.palette.divider}`,
          [`&.${accordionDetailsClasses.expanded}`]: {
            paddingBlock: '0.75rem',
          },
        },
      })}>
      {tokens.map((token, index) => (
        <Accordion key={token.cid.toText()}>
          <AccordionSummary sx={{ py: 1 }}>
            <Stack direction="row" gap={1.5}>
              <Avatar src={token.logo} sx={{ borderRadius: 'sm' }}>
                {token.symbol.slice(0, 1)}
              </Avatar>
              <Stack>
                <Typography level="title-md">
                  {token.name} ({fromBaseUnit(token.amount, token.decimals)})
                </Typography>
                <Typography level="body-xs">{token.cid.toText()}</Typography>
              </Stack>
            </Stack>
          </AccordionSummary>
          <AccordionDetails
            variant="soft"
            sx={{
              borderBottomLeftRadius: index === tokens.length - 1 ? 'lg' : 0,
              borderBottomRightRadius: index === tokens.length - 1 ? 'lg' : 0,
            }}>
            <Stack gap={2}>
              <UnstakedToken {...token} />
              {token.amount > 0 && <StakedToken {...token} />}
            </Stack>
          </AccordionDetails>
        </Accordion>
      ))}
    </AccordionGroup>
  );
}
